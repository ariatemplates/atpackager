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
var dontScrewIE8 = require('../uglifyHelpers/dontScrewIE8');

var resetComments = function (ast) {
    var walker = new UglifyJS.TreeWalker(function (node) {
        if (node.start) {
            delete node.start._comments_dumped;
        }
        if (node.end) {
            delete node.end._comments_dumped;
        }
    });
    ast.walk(walker);
};

module.exports = function (ast, outputOptions) {
    if (outputOptions && outputOptions.comments) {
        resetComments(ast);
    }
    return ast.print_to_string(dontScrewIE8(outputOptions));
};
