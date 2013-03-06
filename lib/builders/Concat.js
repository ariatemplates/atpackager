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
 * This builder creates the output file by concatenating its input files together, adding an optional header at the
 * beginning and a footer at the end.
 * @param {Object} cfg configuration
 */
var Concat = function (cfg) {
    cfg = cfg || {};

    /**
     * Specifies the encoding of the output file. By default, uses grunt.file.defaultEncoding.
     * @type String
     */
    this.outputEncoding = cfg.outputEncoding;

    /**
     * Specifies the header to put at the beginning of the output file.
     * @type String
     */
    this.header = cfg.header;

    /**
     * Specifies the footer to put at the end of the file.
     * @type String
     */
    this.footer = cfg.footer;
};

/**
 * This is the main entry point of the builder to actually write the given output file.
 * @param {Object} outputFile output file
 */
Concat.prototype.build = function (outputFile) {
    var sourceFiles = outputFile.sourceFiles;
    var sourceFilesLength = sourceFiles.length;
    var out = [];
    this.writeHeader(outputFile, out);
    for (var i = 0; i < sourceFilesLength; i++) {
        var curFile = sourceFiles[i];
        this.writeInputFile(outputFile, curFile, out);
    }
    this.writeFooter(outputFile, out);
    var content = out.join('');
    var options = {
        encoding : this.outputEncoding || grunt.file.defaultEncoding
    };
    this.writeOutputFile(outputFile, content, options);
};

/**
 * Writes the header at the beginning of the file. Called by the build method, this is extracted from the build method
 * so that it can be overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {Array} out array of strings with the content of the file, which will be concatenated to produce the final
 * file.
 */
Concat.prototype.writeHeader = function (outputFile, out) {
    if (this.header) {
        out.push(this.header);
    }
};

/**
 * Writes the footer at the end of the file. Called by the build method, this is extracted from the build method so that
 * it can be overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {Array} out array of strings with the content of the file, which will be concatenated to produce the final
 * file.
 */
Concat.prototype.writeFooter = function (outputFile, out) {
    if (this.footer) {
        out.push(this.footer);
    }
};

/**
 * Writes the given input file. Called by the build method, this is extracted from the build method so that it can be
 * overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {Object} sourceFile source file
 * @param {Array} out array of strings with the content of the file, which will be concatenated to produce the final
 * file.
 */
Concat.prototype.writeInputFile = function (outputFile, sourceFile, out) {
    outputFile.packaging.callVisitors('onWriteInputFile', [outputFile, sourceFile]);
    var content = sourceFile.getTextContent();
    out.push(content);
    sourceFile.clearContent(); // clear files once packaged
};

/**
 * Writes the content of the output file with grunt.file.write. Called by the build method, this is extracted from the
 * build method so that it can be overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {String} content content to be written to the file
 * @param {Object} options options to be passed to grunt.file.write
 */
Concat.prototype.writeOutputFile = function (outputFile, content, options) {
    var toBeWritten = {
        content : content,
        options : options
    };
    outputFile.packaging.callVisitors('onWriteOutputFile', [outputFile, toBeWritten]);
    grunt.file.write(outputFile.outputPath, toBeWritten.content, toBeWritten.options);
};

module.exports = Concat;
