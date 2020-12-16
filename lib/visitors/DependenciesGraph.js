/*
 * Copyright 2015 Amadeus s.a.s.
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

var stringifyForDot = function (string) {
    return '"' + string.replace(/"/g, "\"") + '"';
};

var DependenciesGraph = function (cfg) {
    cfg = cfg || {};
    this.sourceFiles = cfg.sourceFiles || ['**/*']; // source files to take into account in the graph
    this.graphFile = cfg.graphFile || 'dependencies.gv'; // the graph file to write
    this.graphFileEncoding = cfg.graphFileEncoding || null; // encoding of the graph file
    this.outputDirectory = cfg.outputDirectory || null; // output directory of the graph file; if not specified, the
    // global one is used
};

DependenciesGraph.prototype.onAfterBuild = function (packaging) {
    var sourceFiles = packaging.sourceFiles;
    var sourceFilesPatterns = this.sourceFiles;
    var cache = {};
    var output = ["digraph dependencies {\n"];

    var processSourceFile = function (sourceFile) {
        var logicalPath = sourceFile.logicalPath;
        if (cache.hasOwnProperty(logicalPath)) {
            return cache[logicalPath];
        }
        if (!sourceFile.isMatch(sourceFilesPatterns)) {
            cache[logicalPath] = false;
            return false;
        }
        cache[logicalPath] = true;
        var dependencies = sourceFile.getDependencies().filter(processSourceFile);
        var stringifiedName = stringifyForDot(normalizePath(sourceFile.logicalPath));
        output.push(stringifiedName, ";\n");
        dependencies.forEach(function (curDep) {
            output.push(stringifiedName, " -> ", stringifyForDot(normalizePath(curDep.logicalPath)), ";\n");
        });
        return true;
    };

    for (var file in sourceFiles) {
        if (sourceFiles.hasOwnProperty(file)) {
            processSourceFile(sourceFiles[file]);
        }
    }

    output.push("}\n");

    var outputGraphFile = path.join(this.outputDirectory || packaging.outputDirectory, this.graphFile);
    grunt.file.write(outputGraphFile, output.join(""), {
        encoding : this.graphFileEncoding || grunt.file.defaultEncoding
    });
};

module.exports = DependenciesGraph;
