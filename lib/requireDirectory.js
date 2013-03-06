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

var path = require('path');
var fs = require('fs');

/**
 * Requires each .js file of a directory (given as a parameter) and returns a map containing the exports of each file.
 * The key in the map is the name of the file without the .js extension.
 * @param {String} directory directory where to look for .js files (when several parameters are given, they are joined
 * with path.join)
 */
module.exports = function () {
    var directory = path.join.apply(path, arguments);
    var res = {};
    var files = fs.readdirSync(directory);
    for (var i = 0; i < files.length; i++) {
        var curName = files[i];
        var match = /^(.*)\.js$/.exec(curName);
        if (match) {
            res[match[1]] = require(path.join(directory, curName));
        }
    }
    return res;
};
