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

var TextReplace = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*'];
    this.replacements = cfg.replacements || [];
};

TextReplace.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var textContent = inputFile.getTextContent();
    this.replacements.forEach(function (entry) {
        textContent = textContent.replace(entry.find, entry.replace);
    });
    inputFile.setTextContent(textContent);
};

module.exports = TextReplace;