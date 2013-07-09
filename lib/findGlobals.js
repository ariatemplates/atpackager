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

var inContext = function () {
    var global = this;
    var undef;
    return function (name) {
        return global[name] !== undef;
    };
};

var isVarBuiltin = function (name) {
    var vm = require("vm");
    // run in an empty context to know which are the built-in globals
    isVarBuiltin = vm.runInNewContext("(" + inContext + ")()");
    return isVarBuiltin(name);
};

var isUndeclaredSymbolRef = function (node, walker, options) {
    if (!(node instanceof UglifyJS.AST_SymbolRef && node.thedef.undeclared)) {
        return false;
    }
    if (node.name == "arguments" && walker.find_parent(UglifyJS.AST_Lambda)) {
        return false;
    }
    if (options.ignoreBuiltin && isVarBuiltin(node.name)) {
        return false;
    }
    return true;
};

var matchStart = function (testName) {
    return function (acceptedPrefix) {
        return (testName.length == acceptedPrefix.length || testName.charAt(acceptedPrefix.length) == ".") &&
                testName.substring(0, acceptedPrefix.length) == acceptedPrefix;
    };
};

var checkWith = function (name, walker, i, options) {
    if (options.includesWith === true) {
        return true;
    }
    var stack = walker.stack;
    for (var j = i; j >= 0; j--) {
        var curItem = stack[j];
        if (curItem instanceof UglifyJS.AST_With && curItem.body === stack[j + 1]) {
            if (Array.isArray(options.includesWith)) {
                return options.includesWith.some(matchStart(name));
            }
            return false;
        }
    }
    // not in a with (...) {...} structure
    return true;
};

module.exports = function (ast, options) {
    options = options || {};
    var res = {};
    ast.figure_out_scope();
    var walker = new UglifyJS.TreeWalker(function (node) {
        if (isUndeclaredSymbolRef(node, walker, options)) {
            var stack = walker.stack;
            var i = stack.length - 2;
            while (i >= 0 && stack[i] instanceof UglifyJS.AST_Dot) {
                i--;
            }
            i++;
            var wholeProperty = stack[i];
            var name = wholeProperty.print_to_string();
            if (checkWith(name, walker, i, options)) {
                res[name] = true;
            }
        }
    });
    ast.walk(walker);
    return Object.keys(res).sort();
};