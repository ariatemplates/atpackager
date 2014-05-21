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

var appendString = function (stringLitteral, mapFunction, array) {
    if (stringLitteral instanceof UglifyJS.AST_String) {
        var value = mapFunction(stringLitteral.value);
        array.push(value);
    } else {
        reportError('Expected a string literal.', stringLitteral);
    }
};

var appendMappedStringLitterals = function (stringLitterals, mapFunction, array) {
    for (var i = 0, l = stringLitterals.length; i < l; i++) {
        appendString(stringLitterals[i], mapFunction, array);
    }
};

var appendMappedMapValueStringLitterals = function (object, mapFunction, array) {
    var properties = object.properties;
    for (var i = 0, l = properties.length; i < l; i++) {
        appendString(properties[i].value, mapFunction, array);
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
    var msg = ["ATDependencies warning: ", errorMsg.yellow];
    var file = item.start.file;
    if (file) {
        msg.push(" in ", file.cyan, ' (line ', item.start.line, ')');
    }
    msg.push('\n ', item.print_to_string().yellow);
    grunt.log.writeln(msg.join(''));
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

var handleArray = function (mapFunction) {
    return function (value, res, walker) {
        if (value instanceof UglifyJS.AST_Array) {
            appendMappedStringLitterals(value.elements, mapFunction, res);
        } else {
            reportError('Expected an array literal', walker.self());
        }
    };
};

var handleMap = function (mapFunction) {
    return function (value, res, walker) {
        if (value instanceof UglifyJS.AST_Object) {
            appendMappedMapValueStringLitterals(value, mapFunction, res);
        } else {
            reportError('Expected an object literal', walker.self());
        }
    };
};

var processNames = {
    '$dependencies' : handleArray(getLogicalPath.JS),
    '$extends' : function (value, res, walker) {
        var extendsType;
        var extendsTypeValue = findMapValue(walker.parent(0), '$extendsType');
        if (extendsTypeValue && extendsTypeValue instanceof UglifyJS.AST_String) {
            extendsType = extendsTypeValue.value;
        }
        if (!getLogicalPath.hasOwnProperty(extendsType)) {
            extendsType = "JS";
        }
        appendString(value, getLogicalPath[extendsType], res);
    },
    '$implements' : handleArray(getLogicalPath.JS),
    '$namespaces' : handleMap(getLogicalPath.JS),
    '$css' : handleArray(getLogicalPath.CSS),
    '$templates' : handleArray(getLogicalPath.TPL),
    '$texts' : handleMap(getLogicalPath.TXT),
    '$macrolibs' : handleArray(getLogicalPath.TML),
    '$csslibs' : handleArray(getLogicalPath.CML)
};

/**
 * Analyses the AST of an Aria Templates file and returns its dependencies as an array of logical paths.
 * @param {Object} ast uglify-js abstract syntax tree
 * @return {Array} array of dependencies
 */
var getATDependencies = function (ast) {
    var res = [];
    var walker = new UglifyJS.TreeWalker(function (node) {
        if (node instanceof UglifyJS.AST_ObjectProperty && processNames.hasOwnProperty(node.key)) {
            if (checkAriaDefinition(walker)) {
                processNames[node.key](node.value, res, walker);
            }
        }
    });
    ast.walk(walker);
    return res;
};

module.exports = getATDependencies;