/*
 * Copyright 2017 Amadeus s.a.s.
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
var atInPackaging = require('../ATInPackaging');
var beanDefinitions = /\.\s*beanDefinitions\s*\(\s*\{/;
var pathSep = /\\/g;

var ATCompileBeans = function (cfg) {
    cfg = cfg || {};
    cfg.files = cfg.files || ['**/*.js'];
    this.config = cfg;
};

ATCompileBeans.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.config.files)) {
        return;
    }
    var content = inputFile.getTextContent();
    if (!beanDefinitions.test(content)) {
        return;
    }
    var logicalPath = inputFile.logicalPath.replace(pathSep, '/');
    var atContext = atInPackaging.getATContext(packaging);
    var result = null;
    var config = this.config;
    atContext.Aria.load({
        classes: ['aria.utils.BeanExtractor'],
        oncomplete: function () {
            atContext.aria.core.DownloadMgr.loadFileContent(logicalPath, content);
            atContext.aria.utils.BeanExtractor.extract(logicalPath, config).thenSync(function (res) {
                result = res;
            }, function (error) {
                grunt.log.error("ATCompileBeans: " + error);
            });
        }
    });
    atContext.execTimeouts();
    if (result) {
        if (result.text && !result.skip) {
            inputFile.setTextContent(result.text);
        }
    } else {
        grunt.log.error("ATCompileBeans: failed for " + inputFile.logicalPath.yellow + ".");
    }
};

module.exports = ATCompileBeans;