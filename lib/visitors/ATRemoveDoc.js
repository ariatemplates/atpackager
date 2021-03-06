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

var uglifyContentProvider = require('../contentProviders/uglifyJS');
var removeDoc = require('../ATRemoveDoc');

var ATRemoveDoc = function (cfg) {
    cfg = cfg || {};
    cfg.files = cfg.files || ['**/*.js'];
    cfg.removeBeanDescription = cfg.hasOwnProperty("removeBeanDescription") ? cfg.removeBeanDescription : true;
    cfg.removeEventDescription = cfg.hasOwnProperty("removeEventDescription") ? cfg.removeEventDescription : true;
    cfg.removeErrorStrings = cfg.hasOwnProperty("removeErrorStrings") ? cfg.removeErrorStrings : false;
    cfg.replaceStaticsInErrors = cfg.hasOwnProperty("replaceStaticsInErrors") ? cfg.replaceStaticsInErrors : false;
    this.config = cfg;
};

ATRemoveDoc.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.config.files)) {
        return;
    }
    var ast = uglifyContentProvider.getAST(inputFile);
    if (ast) {
        var changed = removeDoc(ast, inputFile.logicalPath, this.config);
        if (changed) {
            inputFile.contentProvider = uglifyContentProvider; // makes sure the changed version is used
        }
    }
};

module.exports = ATRemoveDoc;