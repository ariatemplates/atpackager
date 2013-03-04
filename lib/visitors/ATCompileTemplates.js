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
var atCompiledTemplate = require('../contentProviders/ATCompiledTemplate');

var ATCompileTemplates = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*'];
};

ATCompileTemplates.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    if (!atCompiledTemplate.getClassGeneratorFromLogicalPath(inputFile.logicalPath)) {
        return;
    }
    // make sure it is possible to get the template
    var res = atCompiledTemplate.getCompiledTemplate(inputFile);
    if (res == null) {
        grunt.log.error('ATCompileTemplates: could not compile template ' + inputFile.logicalPath.yellow);
        return;
    }
    inputFile.contentProvider = atCompiledTemplate; // and make it the default provider
};

module.exports = ATCompileTemplates;
