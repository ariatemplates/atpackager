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

var CopyUnpackaged = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*'];
    this.builder = cfg.builder || {
        type : "Copy"
    };
};

CopyUnpackaged.prototype.onReachingBuildEnd = function (packaging) {
    var pattern = this.files;
    // loop on all unpackaged files and simply create an output file for each of them
    var sourceFiles = packaging.sourceFiles;
    for (var file in sourceFiles) {
        if (sourceFiles.hasOwnProperty(file)) {
            var curFile = sourceFiles[file];
            if (!curFile.outputFile && curFile.isMatch(pattern)) {
                this._processFile(curFile);
            }
        }
    }
};

CopyUnpackaged.prototype._processFile = function (sourceFile) {
    var packaging = sourceFile.packaging;
    var outputFile = packaging.addOutputFile(sourceFile.logicalPath, true);
    outputFile.builder = packaging.createObject(this.builder, outputFile.builtinBuilders);
    sourceFile.setOutputFile(outputFile);
};

module.exports = CopyUnpackaged;