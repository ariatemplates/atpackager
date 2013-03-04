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

module.exports = {
    getTextContent : function (inputFile) {
        var path = inputFile.packaging.getAbsolutePath(inputFile.logicalPath);
        var text = grunt.file.read(path, {
            encoding : grunt.file.defaultEncoding
        });
        inputFile.setTextContent(text);
        return text;
    },

    getBinaryContent : function (inputFile) {
        var path = inputFile.packaging.getAbsolutePath(inputFile.logicalPath);
        var buffer = grunt.file.read(path, {
            encoding : null
        });
        inputFile.setBinaryContent(buffer);
        return buffer;
    }
};