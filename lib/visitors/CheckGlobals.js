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
var uglifyContentProvider = require('../contentProviders/uglifyJS');
var stdGlobals = ['Math', 'RegExp', 'Array', 'Date', 'Number', 'Function', 'String', 'Error', 'Object', 'parseInt',
        'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
        'escape', 'unescape', 'eval', 'NaN', 'undefined', 'Infinity'];
var commonJSGlobals = ['module', 'exports', 'require', '__filename', '__dirname'];
var allowed = {};
var forbidden = {};

var setGlobalsRule = function (map, array, value) {
    for (var i = 0, l = array.length; i < l; i++) {
        map[array[i]] = value;
    }
};

var CheckGlobals = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.js'];
    this.strict = cfg.strict !== false;
    this.globals = {};
    if (cfg.allowStdJSGlobals !== false) {
        setGlobalsRule(this.globals, stdGlobals, allowed);
    }
    if (cfg.allowCommonJSGlobals) {
        setGlobalsRule(this.globals, commonJSGlobals, allowed);
    }
    if (cfg.allowedGlobals) {
        setGlobalsRule(this.globals, cfg.allowedGlobals, allowed);
    }
    if (cfg.forbiddenGlobals) {
        setGlobalsRule(this.globals, cfg.forbiddenGlobals, forbidden);
    }
    this.globals["arguments"] = allowed;
    this._isGlobalAccepted = this.strict ? this._isGlobalAcceptedStrict : this._isGlobalAcceptedNonStrict;
};

CheckGlobals.prototype._isGlobalAcceptedStrict = function (globalName) {
    return this.globals[globalName] === allowed;
};

CheckGlobals.prototype._isGlobalAcceptedNonStrict = function (globalName) {
    return this.globals[globalName] !== forbidden;
};

CheckGlobals.prototype.onWriteInputFile = function (packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var ast = uglifyContentProvider.getAST(inputFile);
    var self = this;
    if (ast) {
        ast.figure_out_scope({
            screw_ie8: false
        });
        ast.globals.each(function (glob) {
            if (!self._isGlobalAccepted(glob.name)) {
                grunt.log.error("Forbidden access to global variable " + glob.name.yellow + " in " +
                        inputFile.logicalPath.yellow);
            }
        });
    }
};

module.exports = CheckGlobals;
