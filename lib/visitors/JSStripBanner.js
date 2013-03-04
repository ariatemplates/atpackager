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

var JSStripBanner = function (cfg) {
    cfg = cfg || {};
    cfg.files = cfg.files || ['**/*.js'];
    this.config = cfg;
};

JSStripBanner.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    var config = this.config;
    if (!inputFile.isMatch(config.files)) {
        return;
    }

    var src = inputFile.getTextContent();

    // The following code was taken from Grunt 0.3:
    var m = [];
    if (config.line) {
        // Strip // ... leading banners.
        m.push('(?:.*\\/\\/.*\\n)*\\s*');
    }
    if (config.block) {
        // Strips all /* ... */ block comment banners.
        m.push('\\/\\*[\\s\\S]*?\\*\\/');
    } else {
        // Strips only /* ... */ block comment banners, excluding /*! ... */.
        m.push('\\/\\*[^!][\\s\\S]*?\\*\\/');
    }
    var re = new RegExp('^\\s*(?:' + m.join('|') + ')\\s*', '');

    inputFile.setTextContent(src.replace(re, ''));
};

module.exports = JSStripBanner;
