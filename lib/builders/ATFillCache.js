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

var Concat = require('./Concat');
var pathSep = /\\/g;

/**
 * This builder creates files in a format which allows the script to be inserted with a script tag and fills the Aria
 * Templates cache.
 * @param {Object} cfg configuration
 */
var ATFillCache = function (cfg) {
    cfg = cfg || {};
    Concat.call(this, cfg); // parent constructor
};

// ATFillCache extends Concat:
ATFillCache.prototype = new Concat();

/**
 * Writes the given input file. It overrides the method from Concat to write calls to
 * aria.core.DownloadMgr.loadFileContent.
 * @param {Object} outputFile output file
 * @param {Object} sourceFile source file
 * @param {Array} out array of strings with the content of the file, which will be concatenated to produce the final
 * file.
 */
ATFillCache.prototype.writeInputFile = function (outputFile, sourceFile, out) {
    outputFile.packaging.callVisitors('onWriteInputFile', [outputFile, sourceFile]);
    var content = sourceFile.getTextContent();
    out.push('aria.core.DownloadMgr.loadFileContent(', JSON.stringify(sourceFile.logicalPath.replace(pathSep, '/')), ',', JSON.stringify(content), ');\n');
    sourceFile.clearContent(); // clear files once packaged
};

module.exports = ATFillCache;
