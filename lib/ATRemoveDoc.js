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

var UglifyJS = require('uglify-js');

/**
 * Removes documentation-related code in Aria Templates files.
 * @param {Object} ast uglify-js abstract syntax tree
 * @param {String} logicalPath logical path of the file (currently only used to check if the file is aria/Aria.js)
 * @param {Object} config configuration with the following accepted boolean options: removeBeanDescription,
 * removeEventDescription, removeErrorStrings, replaceStaticsInErrors
 * @return {Boolean} true if there was any change applied to the abstract syntax tree. false if the AST was not
 * modified.
 */
module.exports = function (ast, logicalPath, config) {

    /**
     * Set to true when making a change in the ast.
     */
    var changed = false;

    /**
     * Contains the array of statics.
     * @type Array
     */
    var statics = [];

    /**
     * Contains the array of statics found in the Aria class. They are special because they are declared directly on the
     * global Aria object
     * @type Array
     */
    var ariaStatics = [];

    /**
     * Statics to remove. They are taken from $logError/$logWarn/$logInfo/_logError calls
     * @type Array
     */
    var staticsToRemove = [];

    /**
     * Whether the walker is currently in an Aria.beanDefinitions call.
     * @type Boolean
     */
    var isBeanDefinition = false;

    /**
     * Whether the file currently being processed is the Aria singleton
     * @type Boolean
     */
    var isAriaSingleton = !!logicalPath.match(/^aria[\/\\]Aria\.js$/);

    var walker = new UglifyJS.TreeWalker(walkerListener);
    ast.walk(walker);

    updateStatics();

    return changed;

    /**
     * Removes the current object property (= walker.self()).
     */
    function removeCurrentObjectProperty () {
        var self = walker.self();
        var parent = walker.parent();
        changed = true;
        parent.properties = parent.properties.filter(function (item) {
            return item != self;
        });
    }

    /**
     * Function called by the tree walker for each node in the AST.
     * @param {Object} input node from the AST
     * @param {Function} descend function which can be called to manually descend in the AST during the call of
     * walkerListener.
     * @return {Boolean} If returning true, the tree walker does not walk in child nodes of the current node. Otherwise
     * it does.
     */
    function walkerListener (input, descend) {
        if (!isBeanDefinition && checkIfBeanDefinition(input)) {
            isBeanDefinition = true;
            descend();
            isBeanDefinition = false;
            return true;
        }
        if (config.removeBeanDescription && isBeanDefinition && input instanceof UglifyJS.AST_ObjectKeyVal &&
                input.key === "$description" && !(input.value instanceof UglifyJS.AST_Object)) {
            removeCurrentObjectProperty();
            return true;
        }
        if (config.removeEventDescription && !isBeanDefinition && input instanceof UglifyJS.AST_ObjectKeyVal &&
                input.key === "$events" && input.value instanceof UglifyJS.AST_Object) {
            cleanEventsDescription(input.value);
            return true;
        }
        if (!isBeanDefinition && config.removeErrorStrings) {
            detectErrorStrings(input);
        }
    }

    /**
     * Replaces the value of each entry in input.properties by an empty string.
     * @param {Object} input node from the AST (should be an instance of AST_Object)
     */
    function cleanEventsDescription (input) {
        input.properties.forEach(function (elem) {
            changed = true;
            elem.value = new UglifyJS.AST_String({
                value : ""
            });
        });
    }

    /**
     * Returns true if the given node starts with "Aria."
     * @param {Object} input node from the AST
     * @return {Boolean}
     */
    function isAriaDotSomething (input) {
        if (input instanceof UglifyJS.AST_Dot) {
            var shouldBeAria = input.expression;
            return shouldBeAria instanceof UglifyJS.AST_SymbolRef && shouldBeAria.name === "Aria";
        }
        return false;
    }

    /**
     * Detects error strings found in $statics and in calls to $logError/$logWarn/$logInfo/_logError
     * @param {Object} input node from the AST
     */
    function detectErrorStrings (input) {
        if (input instanceof UglifyJS.AST_ObjectKeyVal && input.key === "$statics" &&
                input.value instanceof UglifyJS.AST_Object) {
            statics = statics.concat(input.value.properties);
            return;
        }
        if (isAriaSingleton && input instanceof UglifyJS.AST_Assign && isAriaDotSomething(input.left)) {
            var name = input.left.property;
            if (input.right instanceof UglifyJS.AST_String && /^[A-Z_]+$/.test(name)) {
                ariaStatics.push(input);
            }
            return;
        }

        var stat = checkLogCall(input);
        if (stat) {
            staticsToRemove.push(stat);
        }
    }

    /**
     * Returns the arguments of the function call if the given node is an instruction that logs an error ($logError/$logWarn/$logInfo/_logError ), otherwise null.
     * @param {Object} input node from the AST
     */
    function checkLogCall (input) {
        if (input instanceof UglifyJS.AST_Call && input.expression instanceof UglifyJS.AST_Dot) {
            var methodName = input.expression.property;
            if (/^(\$log)|(_logError)/.test(methodName)) {
                var args = input.args;
                var errorMsg = args[0];
                if (errorMsg instanceof UglifyJS.AST_Dot && /^[A-Z_]+$/.test(errorMsg.property)) {
                    return args;
                }
            }
        }
        return null;

    }

    /**
     * Update the AST corresponding to the previously detected statics in declarations and error calls
     */
    function updateStatics () {
        var currentStatic = null;
        for (var i = 0, ilength = staticsToRemove.length; i < ilength; i++) {
            currentStatic = staticsToRemove[i][0].property;
            if (config.replaceStaticsInErrors) {
                changed = true;
                staticsToRemove[i][0] = new UglifyJS.AST_String({
                    value : currentStatic
                });
            }
            var j, jlength;
            if (isAriaSingleton) {
                for (j = 0, jlength = ariaStatics.length; j < jlength; j++) {
                    if (ariaStatics[j].left.property == currentStatic) {
                        changed = true;
                        ariaStatics[j].right = new UglifyJS.AST_String({
                            value : ""
                        });
                        break;
                    }
                }
            } else {
                for (j = 0, jlength = statics.length; j < jlength; j++) {
                    if (statics[j].key == currentStatic && statics[j].value instanceof UglifyJS.AST_String) {
                        changed = true;
                        statics[j].value.value = "";
                        break;
                    }
                }
            }
        }
    }

    /**
     * Returns true if the given node is "Aria.beanDefinitions"
     * @param {Array} input node from the AST
     * @return {Boolean}
     */
    function checkIfBeanDefinition (input) {
        if (input instanceof UglifyJS.AST_Call) {
            var fnRef = input.expression;
            return isAriaDotSomething(fnRef) && fnRef.property === "beanDefinitions";
        }
        return false;
    }

};