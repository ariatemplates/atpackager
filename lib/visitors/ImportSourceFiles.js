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
var fileLoader = require('../contentProviders/fileLoader');

var ImportSourceFiles = function (cfg) {
    cfg = cfg || {};

    this.sourceFiles = cfg.sourceFiles || "**/*";
    this.sourceDirectory = cfg.sourceDirectory || "";
    this.targetBaseLogicalPath = cfg.targetBaseLogicalPath || "";
};

ImportSourceFiles.prototype.onInit = function (packaging) {
    var expandedFiles = grunt.file.expand({
        filter : "isFile",
        cwd : this.sourceDirectory
    }, this.sourceFiles);
    var baseLogicalPath = this.targetBaseLogicalPath;

    expandedFiles.forEach(function (file) {
        var absolutePath = path.resolve(path.join(this.sourceDirectory, file));
        var logicalPath = path.join(baseLogicalPath, file);
        var sourceFile = packaging.addSourceFile(logicalPath);
        sourceFile.contentProvider = fileLoader;
        fileLoader.setLoadPath(sourceFile, absolutePath);
    }, this);
};

module.exports = ImportSourceFiles;
