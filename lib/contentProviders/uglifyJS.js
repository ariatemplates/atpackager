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

var grunt = require('../grunt').grunt();
var UglifyJS = require("uglify-js");
var astToString = require('../uglifyHelpers/astToString');

UglifyJS.AST_Node.warn_function = function (message) {
    grunt.verbose.writeln("UglifyJS warning: " + message.yellow);
};

var defaultOutputOptions = {
    beautify : true,
    ascii_only : true,
    comments : true,
    screw_ie8 : false
};

var uglifyJSContentProvider = {

    getTextContent : function (inputFile) {
        var contentUglifyJS = inputFile.contentUglifyJS;
        return astToString(contentUglifyJS.ast, contentUglifyJS.outputOptions);
    },

    parse : function (inputFile, fileContent, outputOptions) {
        if (fileContent == null) {
            fileContent = inputFile.getTextContent();
        }
        var ast = null;
        try {
            ast = UglifyJS.parse(fileContent, {
                filename : inputFile.logicalPath
            });

        } catch (e) {
            grunt.log.error("JS parse error in " + inputFile.logicalPath.yellow + " (line " + e.line + ", column " +
                    e.col + ") " + e.message.yellow);
        }
        inputFile.contentUglifyJS = {
            ast : ast,
            outputOptions : outputOptions || defaultOutputOptions
        };
    },

    getAST : function (inputFile, fileContent, outputOptions) {
        if (!inputFile.contentUglifyJS) {
            this.parse(inputFile, fileContent, outputOptions);
        }
        return inputFile.contentUglifyJS.ast;
    },

    setAST : function (inputFile, ast, outputOptions) {
        var contentUglifyJS = inputFile.contentUglifyJS;
        if (!contentUglifyJS) {
            inputFile.contentUglifyJS = {
                ast : ast,
                outputOptions : outputOptions || defaultOutputOptions
            };
        } else {
            contentUglifyJS.ast = ast;
            if (outputOptions) {
                contentUglifyJS.outputOptions = outputOptions;
            }
        }
    },

    getOutputOptions : function (inputFile) {
        return inputFile.contentUglifyJS.outputOptions;
    },

    setOutputOptions : function (inputFile, outputOptions) {
        inputFile.contentUglifyJS.outputOptions = outputOptions || defaultOutputOptions;
    }
};

module.exports = uglifyJSContentProvider;
