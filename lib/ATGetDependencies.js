/*
 * Copyright 2013 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var UglifyJS = require("uglify-js");
var grunt = require('./grunt').grunt();
var findGlobals = require('./findGlobals');

var acceptedAriaMethods = {
    'classDefinition' : 1,
    'interfaceDefinition' : 1,
    'beanDefinitions' : 1,
    'tplScriptDefinition' : 1
};

var getBaseLogicalPath = function (classpath) {
    return classpath.replace(/\./g, '/');
};

var createGetLogicalPathFn = function (extension) {
    return function (classpath) {
        return getBaseLogicalPath(classpath) + extension;
    };
};

var getLogicalPath = {
    JS : createGetLogicalPathFn('.js'),
    TPL : createGetLogicalPathFn('.tpl'),
    RES : createGetLogicalPathFn('.js'),
    CSS : createGetLogicalPathFn('.tpl.css'),
    TML : createGetLogicalPathFn('.tml'),
    CML : createGetLogicalPathFn('.cml'),
    TXT : createGetLogicalPathFn('.tpl.txt')
};

var removeResolvedGlobals = function (globals, classpath) {
    var useful = false;
    for (var i = globals.length - 1; i >= 0; i--) {
        var curGlobal = globals[i];
        if ((curGlobal.length == classpath.length || curGlobal.charAt(classpath.length) == ".") &&
                curGlobal.substring(0, classpath.length) == classpath) {
            useful = true;
            globals.splice(i, 1);
        }
    }
    return useful;
};

var appendString = function (stringLitteral, mapFunction, state, alwaysUseful) {
    if (stringLitteral instanceof UglifyJS.AST_String) {
        var classpath = stringLitteral.value;
        var value = mapFunction(classpath);
        state.declaredDependencies.push(value);
        if (state.unresolvedGlobals) {
            var useful = removeResolvedGlobals(state.unresolvedGlobals, classpath) || alwaysUseful;
            if (!useful) {
                state.uselessDependencies.push(value);
            }
        }
    } else {
        reportError('Expected a string litteral.', stringLitteral);
    }
};

var appendMappedStringLitterals = function (stringLitterals, mapFunction, state, alwaysUseful) {
    for (var i = 0, l = stringLitterals.length; i < l; i++) {
        appendString(stringLitterals[i], mapFunction, state, alwaysUseful);
    }
};

var appendMappedMapValueStringLitterals = function (object, mapFunction, state, alwaysUseful) {
    var properties = object.properties;
    for (var i = 0, l = properties.length; i < l; i++) {
        appendString(properties[i].value, mapFunction, state, alwaysUseful);
    }
};

var findMapValue = function (astObject, key) {
    var properties = astObject.properties;
    for (var i = 0, l = properties.length; i < l; i++) {
        var curProperty = properties[i];
        if (curProperty.key === key) {
            return curProperty.value;
        }
    }
};

var reportError = function (errorMsg, item) {
    grunt.log.writeln(["ATDependencies warning: ", errorMsg.yellow, " in ", item.start.file.cyan, ' (line ',
            item.start.line, ')\n ', item.print_to_string().yellow].join(''));
};

var checkAriaDefinition = function (walker) {
    // check that the walker is positioned in the argument of
    // an Aria.classDefinition, Aria.interfaceDefinition, Aria.tplScriptDefinition or Aria.beanDefinitions
    var parent = walker.parent(1);
    if (parent instanceof UglifyJS.AST_Call) {
        var expr = parent.expression;
        if (expr instanceof UglifyJS.AST_Dot) {
            var aria = expr.expression;
            if (aria instanceof UglifyJS.AST_SymbolRef && aria.name === "Aria" &&
                    acceptedAriaMethods.hasOwnProperty(expr.property)) {
                return true;
            }
        }
    }
    // To check what is happening:
    // reportError('Not taking the property into account.', walker.self())
    return false;
};

var handleArray = function (mapFunction, alwaysUseful) {
    return function (value, state, walker) {
        if (value instanceof UglifyJS.AST_Array) {
            appendMappedStringLitterals(value.elements, mapFunction, state, alwaysUseful);
        } else {
            reportError('Expected an array litteral', walker.self());
        }
    };
};

var handleMap = function (mapFunction) {
    return function (value, state, walker) {
        if (value instanceof UglifyJS.AST_Object) {
            appendMappedMapValueStringLitterals(value, mapFunction, state, true);
        } else {
            reportError('Expected an object litteral', walker.self());
        }
    };
};

var processNames = {
    '$classpath' : function (value, state) {
        if (value instanceof UglifyJS.AST_String && state.unresolvedGlobals) {
            removeResolvedGlobals(state.unresolvedGlobals, value.value);
        }
    },
    '$dependencies' : handleArray(getLogicalPath.JS),
    '$extends' : function (value, state, walker) {
        var extendsType;
        var extendsTypeValue = findMapValue(walker.parent(0), '$extendsType');
        if (extendsTypeValue && extendsTypeValue instanceof UglifyJS.AST_String) {
            extendsType = extendsTypeValue.value;
        }
        if (!getLogicalPath.hasOwnProperty(extendsType)) {
            extendsType = "JS";
        }
        appendString(value, getLogicalPath[extendsType], state, true);
    },
    '$implements' : handleArray(getLogicalPath.JS, true),
    '$namespaces' : handleMap(getLogicalPath.JS),
    '$css' : handleArray(getLogicalPath.CSS, true),
    '$templates' : handleArray(getLogicalPath.TPL, true),
    '$texts' : handleMap(getLogicalPath.TXT)
};

/**
 * Analyses the AST of an Aria Templates file and returns its dependencies as an array of logical paths.
 * @param {Object} ast uglify-js abstract syntax tree
 * @return {Array} array of dependencies
 */
var getATDependencies = function (ast, options) {
    options = options || {};
    var state = {
        declaredDependencies : []
    };
    if (options.checkGlobals !== false) {
        state.unresolvedGlobals = findGlobals(ast, {
            ignoreBuiltin : options.ignoreBuiltinGlobals,
            includesWith : options.includesWithGlobals
        });
        state.uselessDependencies = [];
        var resolvedGlobals = (options.resolvedGlobals || []).concat("Aria");
        for (var i = 0, l = resolvedGlobals.length; i < l; i++) {
            removeResolvedGlobals(state.unresolvedGlobals, resolvedGlobals[i]);
        }
    }
    var walker = new UglifyJS.TreeWalker(function (node) {
        if (node instanceof UglifyJS.AST_ObjectProperty && processNames.hasOwnProperty(node.key)) {
            if (checkAriaDefinition(walker)) {
                processNames[node.key](node.value, state, walker);
            }
        }
    });
    ast.walk(walker);
    return state;
};

module.exports = getATDependencies;