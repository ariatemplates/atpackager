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
var crypto = require('crypto');
var path = require('path');

var Hash = function (cfg) {
    cfg = cfg || {};
    this.hash = cfg.hash || 'md5';
    this.pattern = cfg.pattern || '[name]-[hash][extension]';
    this.files = cfg.files || ['**/*'];
};

Hash.prototype.onAfterOutputFileBuild = function (packaging, outputFile) {
    if (!outputFile.isMatch(this.files)) {
        return;
    }
    var hash = this._computeHash(outputFile.outputPath);
    var oldLogicalPath = outputFile.logicalPath;
    var newLogicalPath = this._computeNewFileName(oldLogicalPath, hash);
    packaging.renameOutputFile(oldLogicalPath, newLogicalPath);
};

Hash.prototype._computeHash = function (filePath) {
    var content = grunt.file.read(filePath, {
        encoding : null
    });

    if (this.hash == "murmur3") {
        content = content.toString();
        var digest = require('murmurhash-js').murmur3(content);
        // murmur3 output is 32bit integer, convert it to base36 string (max. 7 chars from [0-9a-z])
        return digest.toString(36);
    }

    var hash = crypto.createHash(this.hash);
    hash.update(content);
    return hash.digest('hex');
};

Hash.prototype._computeNewFileName = function (oldFileName, hash) {
    var directory = path.dirname(oldFileName);
    var extension = path.extname(oldFileName);
    var basename = path.basename(oldFileName, extension);
    var variables = {
        name : basename,
        hash : hash,
        extension : extension
    };
    var newName = this.pattern.replace(/\[(name|hash|extension)\]/gi, function (match, name) {
        return variables[name.toLowerCase()];
    });
    return path.join(directory, newName);
};

module.exports = Hash;