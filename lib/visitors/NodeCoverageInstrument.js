/*
 * Copyright 2018 Amadeus s.a.s.
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

var path = require('path');
var coverage = require('node-coverage');
var instrument = coverage.instrument;
var grunt = require('../grunt').grunt();

var NodeCoverageInstrument = function (cfg) {
    cfg = cfg || {};
    cfg.files = cfg.files || ['**/*.js'];
    this.config = cfg;
    this.pathPrefix =  cfg.pathPrefix || ''; // prefix to add to all file paths in the coverage report
    this.infoFile = cfg.infoFile || 'coverage-instrumentation.json'; // instrumentation info file to be created
    this.infoFileEncoding = cfg.infoFileEncoding || null; // encoding of the info file
    this.outputDirectory = cfg.outputDirectory || null; // output directory of the info file; if not specified, the global one is used
    this.nodeCoverageOptions = cfg.nodeCoverageOptions; // options to pass to node-coverage
    this.infoFileContent = {};
};

NodeCoverageInstrument.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    var config = this.config;
    if (!inputFile.isMatch(config.files)) {
        return;
    }
    var src = inputFile.getTextContent();
    var fileName = path.join(this.pathPrefix, inputFile.logicalPath).split(path.sep).join('/');
    var result = instrument(fileName, src, this.nodeCoverageOptions);
    if (result.staticInfo) {
        inputFile.setTextContent(result.clientCode);
        this.infoFileContent[fileName] = result.staticInfo;
    }
};

NodeCoverageInstrument.prototype.onAfterBuild = function (packaging) {
    var infoFileContent = JSON.stringify(this.infoFileContent);
    var infoFileName = path.join(this.outputDirectory || packaging.outputDirectory, this.infoFile);
    grunt.file.write(infoFileName, infoFileContent, {
        encoding : this.infoFileEncoding || grunt.file.defaultEncoding
    });
};

module.exports = NodeCoverageInstrument;
