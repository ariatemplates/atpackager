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

var UglifyJS = require('uglify-js');
var uglifyJSContentProvider = require('../contentProviders/uglifyJS');
var JSConcat = require('../builders/JSConcat');
var dontScrewIE8 = require('../uglifyHelpers/dontScrewIE8');

var JSMinify = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.js'];
    this.outputFiles = cfg.outputFiles || ['**/*'];
    this.inputFiles = cfg.inputFiles || ['**/*'];
    this.skipJSConcatParts = "skipJSConcatParts" in cfg ? cfg.skipJSConcatParts : true;
    if (cfg.compress !== false) {
        this.compressor = UglifyJS.Compressor(dontScrewIE8(cfg.compress || {}));
    }
    if (cfg.mangle !== false) {
        this.mangle = cfg.mangle || {};
    }
    this.outputOptions = cfg.output || {
        ascii_only : true,
        screw_ie8 : false
    };
};

JSMinify.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!(inputFile.isMatch(this.files) && inputFile.isMatch(this.inputFiles))) {
        return;
    }
    if (this.skipJSConcatParts && outputFile.builder instanceof JSConcat) {
        // skip files packaged in a JSConcat file
        // (in most cases, the JSConcat file will be minified as a whole)
        return;
    }
    var ast = uglifyJSContentProvider.getAST(inputFile);
    if (ast) {
        this._compressAST(ast);
        uglifyJSContentProvider.setAST(inputFile, ast, this.outputOptions);
        inputFile.contentProvider = uglifyJSContentProvider; // makes sure the minified version is used
    }
};

JSMinify.prototype.onWriteJSOutputFile = function (packaging, outputFile, toBeWritten) {
    if (!(outputFile.isMatch(this.files) && outputFile.isMatch(this.outputFiles))) {
        return;
    }
    this._compressAST(toBeWritten.content);
    toBeWritten.options = this.outputOptions;
};

JSMinify.prototype._compressAST = function (ast) {
    if (this.compressor) {
        ast.figure_out_scope({
           screw_ie8: false
        });
        ast = ast.transform(this.compressor);
    }
    if (this.mangle) {
        ast.figure_out_scope({
            screw_ie8: false
        });
        ast.compute_char_frequency();
        ast.mangle_names(dontScrewIE8(this.mangle));
    }
};

module.exports = JSMinify;
