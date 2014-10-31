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
var uglifyContentProvider = require('../contentProviders/uglifyJS');
var astToString = require('../uglifyHelpers/astToString.js');
var jsToAST = require('../uglifyHelpers/jsToAST.js');
var UglifyJS = require("uglify-js");
var atInPackaging = require('../ATInPackaging');
var vm = require('vm');
var SKIN_CLASSPATH = 'aria.widgets.AriaSkin';

var filterMessage = function (error) {
    return error.msg;
};

var evalClassDefinition = function (fileContent, logicalPath) {
    var res = null;
    vm.runInNewContext(fileContent, {
        Aria : {
            classDefinition : function (classDef) {
                res = classDef;
            }
        }
    }, logicalPath);
    return res;
};

var ATNormalizeSkin = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.js'];
    this.strict = cfg.strict;
    this.outputOptions = cfg.outputOptions || {beautify: true, quote_keys: true};
};

ATNormalizeSkin.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var fileContent = inputFile.getTextContent();
    if (fileContent.indexOf(SKIN_CLASSPATH) == -1) {
        // skip files without the skin classpath
        return;
    }

    var strict = this.strict;
    var ast = uglifyContentProvider.getAST(inputFile, fileContent);
    var transformer = new UglifyJS.TreeTransformer(function (node) {
        if (node instanceof UglifyJS.AST_Object && node.properties.length > 0 && node.properties[0].key === "$classpath" && node.properties[0].value.value === SKIN_CLASSPATH) {
            var skinClassDef = evalClassDefinition(astToString(this.parent(1)), inputFile.logicalPath);
            if (skinClassDef.$classpath != SKIN_CLASSPATH) {
                return;
            }

            var skinObject = skinClassDef.$prototype.skinObject;
            var atContext = atInPackaging.getATContext(packaging);
            var newNode = null;
            atContext.Aria.load({
                classes : ['aria.widgets.AriaSkinNormalization', 'aria.core.Log', 'aria.core.log.SilentArrayAppender'],
                oncomplete : function () {
                    var appenders = atContext.aria.core.Log.getAppenders();
                    var previousAppenders = appenders.splice(0, appenders.length); // Remove and keep previous appenders
                    var logArrayAppender = appenders[0] = new atContext.aria.core.log.SilentArrayAppender();
                    atContext.aria.widgets.AriaSkinNormalization.normalizeSkin(skinObject);
                    appenders.splice(0, 1); // remove our appender
                    appenders.push.apply(appenders, previousAppenders); // restore previous appenders

                    var errors = logArrayAppender.getLogs();
                    var nbErrors = errors.length;
                    logArrayAppender.$dispose();
                    if (nbErrors > 0) {
                        var message = "ATNormalizeSkin: " + nbErrors + " error(s) in " + inputFile.logicalPath.yellow + ":\n" +
                                errors.map(filterMessage).join("\n");
                        if (strict) {
                            grunt.log.error(message);
                        } else {
                            grunt.log.writeln(message);
                            grunt.log.writeln("Note: to fail the build on a skin normalization error, please set the strict parameter to true in the config of ATNormalizeSkin.");
                        }
                    }
                    //Stringify and parse to remove undefined properties in the object, otherwise jsToAST creates "void 0" in the AST.
                    newNode = jsToAST(JSON.parse(JSON.stringify(skinClassDef)));
                }
            });
            atContext.execTimeouts();
            if (newNode) {
                return newNode;
            }
            else {
                grunt.log.error("ATNormalizeSkin: could not normalize " + inputFile.logicalPath.yellow); 
            }
        }
    });

    var ast2 = ast.transform(transformer);
    uglifyContentProvider.setAST(inputFile, ast2, this.outputOptions);
    inputFile.contentProvider = uglifyContentProvider;
};

module.exports = ATNormalizeSkin;
