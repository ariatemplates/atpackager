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

var normalizePath = function (filePath) {
    return path.normalize(filePath).split(path.sep).join('/'); // only forward slashes for the web
};

var addToMap = function (map, sourceFile, entry) {
    if (map.hasOwnProperty(sourceFile)) {
        grunt.log.error('lMap: conflicting entries in the map for ' + sourceFile.yellow);
    }
    map[sourceFile] = entry;
};

var _Map = function (cfg) {
    cfg = cfg || {};
    this.sourceFiles = cfg.sourceFiles || ['**/*']; // source files to take into account in the map
    this.outputFiles = cfg.outputFiles || ['**/*']; // output files to take into account in the map
    this.mapFile = cfg.mapFile || 'map.json'; // file the map should be appended to
    this.mapFileEncoding = cfg.mapFileEncoding || null; // encoding of the map file
    this.outputDirectory = cfg.outputDirectory || null; // output directory of the map file; if not specified, the global
    // one is used
};

_Map.prototype.onAfterBuild = function (packaging) {
    var map = {};

    var sourceFiles = packaging.sourceFiles;
    var sourceFilesPatterns = this.sourceFiles;
    var outputFilesPatterns = this.outputFiles;

    for (var file in sourceFiles) {
        var curSourceFile = sourceFiles[file];
        var outputFile = curSourceFile.outputFile;

        var includeFile = sourceFiles.hasOwnProperty(file) && outputFile;
        includeFile = includeFile && curSourceFile.isMatch(sourceFilesPatterns);
        includeFile = includeFile && outputFile.isMatch(outputFilesPatterns);

        if (includeFile) {
            var normalizedCurSourceFilePath = normalizePath(curSourceFile.logicalPath);
            var normalizedOutputFilePath = normalizePath(outputFile.logicalPath);
            addToMap(map, normalizedCurSourceFilePath, normalizedOutputFilePath);
        }
    }

    var urlMapString = JSON.stringify(map);
    var outputMap = path.join(this.outputDirectory || packaging.outputDirectory, this.mapFile);
    grunt.file.write(outputMap, urlMapString, {
        encoding : this.mapFileEncoding || grunt.file.defaultEncoding
    });
};

module.exports = _Map;
