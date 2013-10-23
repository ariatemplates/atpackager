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

module.exports = function (wrapper, statements) {
    if (statements instanceof UglifyJS.AST_Node) {
        statements = [statements];
    }
    if (Array.isArray(statements)) {
        statements = {
            "$CONTENT$" : statements
        };
    }
    var result = UglifyJS.parse(wrapper);
    result = result.transform(new UglifyJS.TreeTransformer(function (node) {
        if (node instanceof UglifyJS.AST_SimpleStatement) {
            node = node.body;
            var nodeName = node.name;
            if (node instanceof UglifyJS.AST_SymbolRef && statements.hasOwnProperty(nodeName)) {
                return UglifyJS.MAP.splice(statements[nodeName]);
            }
        }
    }));

    return result;
};
