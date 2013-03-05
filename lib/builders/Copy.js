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

/**
 * This builder creates the output file by doing a binary copy of its only input file (there is an error if it has
 * several input files).
 */
var Copy = function () {};

/**
 * This is the main entry point of the builder to actually write the given output file.
 * @param {Object} outputFile output file
 */
Copy.prototype.build = function (outputFile) {
    var sourceFiles = outputFile.sourceFiles;
    if (sourceFiles.length !== 1) {
        grunt.log.error(outputFile.logicalPath.yellow + " is supposed to be built with the 'copy' builder, but has " +
                ("" + sourceFiles.length).yellow + " (!== 1) input files.");
        return;
    }
    var onlySourceFile = sourceFiles[0];
    outputFile.packaging.callVisitors('onWriteInputFile', [outputFile, onlySourceFile]);
    var toBeWritten = {
        content : onlySourceFile.getBinaryContent(),
        options : {}
    };
    onlySourceFile.clearContent();
    outputFile.packaging.callVisitors('onWriteOutputFile', [outputFile, toBeWritten]);
    grunt.file.write(outputFile.outputPath, toBeWritten.content, toBeWritten.options);
};

module.exports = Copy;
