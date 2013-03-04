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

var JSMinify = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.js'];
    if (cfg.compress !== false) {
        this.compressor = UglifyJS.Compressor(cfg.compress || {});
    }
    this.mangle = (cfg.mangle !== false);
    this.outputOptions = cfg.output || {
        ascii_only : true
    };
};

JSMinify.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var ast = uglifyJSContentProvider.getAST(inputFile);
    if (ast) {
        if (this.compressor) {
            ast.figure_out_scope();
            ast = ast.transform(this.compressor);
        }
        if (this.mangle) {
            ast.figure_out_scope();
            ast.compute_char_frequency();
            ast.mangle_names();
        }
        uglifyJSContentProvider.setAST(inputFile, ast, this.outputOptions);
        inputFile.contentProvider = uglifyJSContentProvider; // makes sure the minified version is used
    }
};

module.exports = JSMinify;
