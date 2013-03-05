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

var Concat = require('./Concat');
var pathSep = /\\/g;

/**
 * This builder creates files in the Aria Templates multipart format.
 * @param {Object} cfg configuration
 */
var ATMultipart = function (cfg) {
    cfg = cfg || {};
    Concat.call(this, cfg); // parent constructor

    /**
     * Specifies the separator to use between files. This sequence should not appear in any of the files.
     */
    this.multipartBoundary = cfg.multipartBoundary || '*******************';
};

// ATMultipart extends Concat:
ATMultipart.prototype = new Concat();

/**
 * Writes the header at the beginning of the file. It overrides the method from Concat to write the Aria Templates
 * multi-part header.
 * @param {Object} outputFile output file
 * @param {Array} out array of strings with the content of the file, which will be concatenated to produce the final
 * file.
 */
ATMultipart.prototype.writeHeader = function (outputFile, out) {
    Concat.prototype.writeHeader.call(this, outputFile, out);
    if (outputFile.sourceFiles.length !== 1) {
        out.push('//***MULTI-PART');
    }
};

/**
 * Writes the given input file. It overrides the method from Concat to write the Aria Templates multi-part separators.
 * @param {Object} outputFile output file
 * @param {Object} inputFile source file
 * @param {Array} out array of strings with the content of the file, which will be concatenated to produce the final
 * file.
 */
ATMultipart.prototype.writeInputFile = function (outputFile, inputFile, out) {
    if (outputFile.sourceFiles.length !== 1) {
        out.push('\n//', this.multipartBoundary, '\n//LOGICAL-PATH:', inputFile.logicalPath.replace(pathSep, '/'), '\n//', this.multipartBoundary, '\n');
    }
    Concat.prototype.writeInputFile.call(this, outputFile, inputFile, out);
};

module.exports = ATMultipart;
