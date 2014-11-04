/*
 * Copyright 2014 Amadeus s.a.s.
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

var multiPartHeader = /^(\/\*[\s\S]*?\*\/\s*\r?\n)?\/\/\*\*\*MULTI-PART(\r?\n[^\n]+\n)/;
var logicalPathHeader = /^\/\/LOGICAL-PATH:([^\s]+)$/;

var parseMultiPart = function (fileContent, filePath, callback) {
    var multipart = multiPartHeader.exec(fileContent);
    if (multipart != null) {
        // it is multipart, we split it; separator is multipart[2]
        var parts = fileContent.split(multipart[2]), partsLength = parts.length;
        var logicalPath; // current logical path
        for (var i = 1; i < partsLength; i += 2) {
            logicalPath = logicalPathHeader.exec(parts[i]);
            if (logicalPath != null) {
                logicalPath = logicalPath[1];
            }
            var content = parts[i + 1];
            if (logicalPath == null || content == null) {
                grunt.log.error("Multipart file " + filePath.yellow + " contains an invalid entry (logical path: " + logicalPath + ")");
                continue;
            }
            callback(content, logicalPath);
        }
    } else {
        callback(fileContent, filePath);
    }
};

var ATImportPackages = function (cfg) {
    cfg = cfg || {};
    // setting builder to false allows to repackage differently
    this.builder = cfg.builder != null ? cfg.builder : {
        type : "ATMultipart"
    };
    this.sourcePackages = cfg.sourcePackages || "**/*";
    this.sourceDirectory = cfg.sourceDirectory || "";
    this.logicalPaths = cfg.logicalPaths || "**/*";
};

ATImportPackages.prototype.onInit = function (packaging) {
    var expandedFiles = grunt.file.expand({
        filter : "isFile",
        cwd : this.sourceDirectory
    }, this.sourcePackages);
    var builder = this.builder;
    var filterLogicalPaths = this.logicalPaths;

    expandedFiles.forEach(function (filePath) {
        var fileAbsolutePath = path.resolve(path.join(this.sourceDirectory, filePath));
        var fileContent = grunt.file.read(fileAbsolutePath, {
            encoding : grunt.file.defaultEncoding
        });
        var outputFile = null;
        if (builder) {
            outputFile = packaging.addOutputFile(filePath, true);
            outputFile.builder = packaging.createObject(builder, outputFile.builtinBuilders);
        }
        parseMultiPart(fileContent, filePath, function (content, logicalPath) {
            var isMatch = grunt.file.isMatch(filterLogicalPaths, [logicalPath]);
            if (!isMatch) {
                return;
            }
            var sourceFile = packaging.addSourceFile(logicalPath, true);
            sourceFile.setTextContent(content);
            if (outputFile) {
                sourceFile.setOutputFile(outputFile);
            }
        });
    }, this);
};

module.exports = ATImportPackages;
