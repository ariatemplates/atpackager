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
var UglifyJS = require('uglify-js');
var uglifyJSContentProvider = require('../contentProviders/uglifyJS');
var wrapCode = require('../uglifyHelpers/wrapCode');
var astToString = require('../uglifyHelpers/astToString');

/**
 * This builder creates the output file by concatenating its input Javascript files together. Unlike the Concat builder
 * which can concatenate any file type regardless of the content, the JSConcat builder is specialized for Javascript and
 * the content is processed as an uglify-js AST (Abstract Syntax Tree). Each input file can be wrapped in some
 * Javascript structure specified in the inputFileWrapper configuration property, and also the whole output file can be
 * wrapped similarly by setting the outputFileWrapper property. Any visitor (such as the JSMinify visitor) can process
 * the resulting whole AST by implementing the onWriteJSOutputFile method. Then the AST is converted to a string and the
 * header and footer specified in the configuration are added. As with the Concat builder, visitors can also modify the
 * string version of the output file through the onWriteOutputFile method, before the file is written to the disk.
 * @param {Object} cfg configuration
 */
var JSConcat = function (cfg) {
    cfg = cfg || {};

    /**
     * Specifies the encoding of the output file. By default, uses grunt.file.defaultEncoding.
     * @type String
     */
    this.outputEncoding = cfg.outputEncoding;

    /**
     * Options to be passed to uglify-js when converting the AST (Abstract Syntax Tree) to a string.
     */
    this.jsOutputOptions = cfg.jsOutputOptions || {
        beautify : true,
        ascii_only : true,
        comments : true
    };

    /**
     * Wrapper for input files. This should be some JS code containing the special $CONTENT$ keyword which will be
     * replaced by the content of each input file.
     */
    this.inputFileWrapper = cfg.inputFileWrapper || "$CONTENT$";

    /**
     * Wrapper for the output file. This should be some JS code containing the special $CONTENT$ keyword which will be
     * replaced by the content of the outputfile.
     */
    this.outputFileWrapper = cfg.outputFileWrapper || "$CONTENT$";

    /**
     * Specifies the header to put at the beginning of the output file.
     * @type String
     */
    this.header = cfg.header || "";

    /**
     * Specifies the footer to put at the end of the output file.
     * @type String
     */
    this.footer = cfg.footer || "";
};

/**
 * This is the main entry point of the builder to actually write the given output file.
 * @param {Object} outputFile output file
 */
JSConcat.prototype.build = function (outputFile) {
    var sourceFiles = outputFile.sourceFiles;
    var sourceFilesLength = sourceFiles.length;

    var body = [];
    for (var i = 0; i < sourceFilesLength; i++) {
        var curFile = sourceFiles[i];
        this.writeInputFile(outputFile, curFile, body);
    }
    var ast = new UglifyJS.AST_Toplevel({
        body : this.wrapOutputFile(outputFile, body)
    });

    this.writeJSOutputFile(outputFile, ast);
};

/**
 * Writes the given input file. Called by the build method, this is extracted from the build method so that it can be
 * overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {Object} sourceFile source file
 * @param {Array} out array of ASTs with the content of the file, which will be concatenated to produce the final file.
 */
JSConcat.prototype.writeInputFile = function (outputFile, sourceFile, body) {
    outputFile.packaging.callVisitors('onWriteInputFile', [outputFile, sourceFile]);
    var localAST = uglifyJSContentProvider.getAST(sourceFile);
    var inputFileBody = this.wrapInputFile(outputFile, sourceFile, localAST.body);
    body.push.apply(body, inputFileBody);
    sourceFile.clearContent(); // clear files once packaged
};

/**
 * Wraps an input file before it is appended to the output file. Called by the writeInputFile method, this is extracted
 * from the writeJSOutputFile method so that it can be overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {Object} sourceFile source file
 * @param {Array} body array of statements from the input file to be wrapped
 * @return {Array} array of statements forming the wrapped input file
 */
JSConcat.prototype.wrapInputFile = function (outputFile, sourceFile, body) {
    return wrapCode(this.inputFileWrapper, body).body;
};

/**
 * Wraps the output file before it is sent to writeJSOutputFile. Called by the build method, this is extracted from the
 * writeJSOutputFile method so that it can be overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {Array} body array of statements from the output file to be wrapped
 * @return {Array} array of statements forming the wrapped output file
 */
JSConcat.prototype.wrapOutputFile = function (outputFile, body) {
    return wrapCode(this.outputFileWrapper, body).body;
};

/**
 * Converts the AST to a string and writes it to the output file by calling writeOutputFile. Called by the build method,
 * this is extracted from the build method so that it can be overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {Object} ast abstract syntax tree to be written in the output file
 */
JSConcat.prototype.writeJSOutputFile = function (outputFile, ast) {
    var toBeWritten = {
        content : ast,
        options : this.jsOutputOptions
    };
    outputFile.packaging.callVisitors('onWriteJSOutputFile', [outputFile, toBeWritten]);

    var content = astToString(ast, toBeWritten.options);
    var options = {
        encoding : this.outputEncoding || grunt.file.defaultEncoding
    };
    content = this.header + content + this.footer;
    this.writeOutputFile(outputFile, content, options);
};

/**
 * Writes the content of the output file with grunt.file.write. Called by the writeJSOutputFile method, this is
 * extracted from the writeJSOutputFile method so that it can be overridden by sub-classes.
 * @param {Object} outputFile output file
 * @param {String} content content to be written to the file
 * @param {Object} options options to be passed to grunt.file.write
 */
JSConcat.prototype.writeOutputFile = function (outputFile, content, options) {
    var toBeWritten = {
        content : content,
        options : options
    };
    outputFile.packaging.callVisitors('onWriteOutputFile', [outputFile, toBeWritten]);
    grunt.file.write(outputFile.outputPath, toBeWritten.content, toBeWritten.options);
};

module.exports = JSConcat;
