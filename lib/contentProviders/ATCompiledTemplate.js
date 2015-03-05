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
var path = require('path');
var atInPackaging = require('../ATInPackaging');

// Copied from ariatemplates/aria/core/loaders/GeneralTplPreprocessor.js :
var firstComment = /^\s*\/\*[\s\S]*?\*\//;
var alreadyGeneratedRegExp = /^\s*(?:var\s+|Aria\.classDefinition\()/;
var isTemplateCompiled = function (fileContent) {
    fileContent = fileContent.replace(firstComment, ''); // removes first comment
    return alreadyGeneratedRegExp.test(fileContent);
};
// End of copied code

var classGeneratorsByExtension = {
    'tpl' : 'aria.templates.TplClassGenerator',
    'tpl.css' : 'aria.templates.CSSClassGenerator',
    'tml' : 'aria.templates.TmlClassGenerator',
    'tpl.txt' : 'aria.templates.TxtClassGenerator',
    'cml' : 'aria.templates.CmlClassGenerator'
};

var getExtension = function (file) {
    var baseName = path.basename(file);
    var dot = baseName.indexOf('.');
    if (dot > -1) {
        return baseName.substring(dot + 1);
    }
};

var ATCompiledTemplate = {

    getClassGeneratorFromLogicalPath : function (logicalPath) {
        var extension = getExtension(logicalPath);
        if (!classGeneratorsByExtension.hasOwnProperty(extension)) {
            return null;
        }
        return classGeneratorsByExtension[extension];
    },

    getTextContent : function (inputFile) {
        return inputFile.contentATCompiledTemplate;
    },

    getCompiledTemplate : function (inputFile, fileContent, logicalPath) {
        if (!inputFile.contentATCompiledTemplate) {
            this.compile(inputFile, fileContent, logicalPath);
        }
        return inputFile.contentATCompiledTemplate;
    },

    compile : function (inputFile, fileContent, logicalPath) {
        if (logicalPath == null) {
            logicalPath = inputFile.logicalPath;
        }
        var classGenerator = this.getClassGeneratorFromLogicalPath(logicalPath);
        if (!classGenerator) {
            grunt.log.error("Cannot compile " + logicalPath.yellow + " as a template.");
            return;
        }
        if (fileContent == null) {
            fileContent = inputFile.getTextContent();
        }
        var compiledTemplate;
        if (isTemplateCompiled(fileContent)) {
            // should already be an Aria class
            compiledTemplate = fileContent;
        } else {
            var atContext = atInPackaging.getATContext(inputFile.packaging);
            atContext.Aria.load({
                classes : [classGenerator],
                oncomplete : function () {
                    var generator = atContext.Aria.getClassRef(classGenerator);
                    generator.parseTemplate(fileContent, true, function (res) {
                        if (res.classDef) {
                            compiledTemplate = res.classDef;
                        }
                    });
                }
            });
            atContext.execTimeouts();
        }
        inputFile.contentATCompiledTemplate = compiledTemplate;
    }
};

module.exports = ATCompiledTemplate;
