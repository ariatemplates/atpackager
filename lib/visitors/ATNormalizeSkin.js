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
var atInPackaging = require('../ATInPackaging');
var vm = require('vm');
var SKIN_CLASSPATH = 'aria.widgets.AriaSkin';

var evalClassDefinition = function (fileContent, logicalPath) {
    var res = null;
    vm.runInNewContext(fileContent, {
        Aria : {
            classDefinition : function (classDef) {
                res = classDef;
            }
        }
    }, logicalPath);
    return res;
};

var ATNormalizeSkin = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.js'];
    this.jsonIndent = cfg.jsonIndent == null ? '    ' : cfg.jsonIndent;
};

ATNormalizeSkin.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var fileContent = inputFile.getTextContent();
    if (fileContent.indexOf(SKIN_CLASSPATH) == -1) {
        // skip files without the skin classpath
        return;
    }

    var skinClassDef = evalClassDefinition(fileContent, inputFile.logicalPath);
    if (skinClassDef.$classpath != SKIN_CLASSPATH) {
        return;
    }
    var skinObject = skinClassDef.$prototype.skinObject;
    var jsonIndent = this.jsonIndent;

    var atContext = atInPackaging.getATContext(packaging);
    var newContent;
    atContext.Aria.load({
        classes : ['aria.widgets.AriaSkinNormalization'],
        oncomplete : function () {
            atContext.aria.widgets.AriaSkinNormalization.normalizeSkin(skinObject);
            newContent = 'Aria.classDefinition(' + JSON.stringify(skinClassDef, null, jsonIndent) + ');';
        }
    });
    atContext.execTimeouts();
    if (!newContent) {
        grunt.log.error("ATNormalizeSkin: could not normalize " + inputFile.logicalPath.yellow);
        return;
    }
    inputFile.setTextContent(newContent);
};

module.exports = ATNormalizeSkin;
