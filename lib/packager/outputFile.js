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
var grunt = require('../grunt').grunt();

/**
 * This class represents an output file.
 * @param {Object} packaging Reference to the packaging this output file belongs to.
 * @param {String} logicalPath Logical path of this output file.
 */
var OutputFile = function (packaging, logicalPath) {
    /**
     * Reference to the packaging which contains this output file.
     */
    this.packaging = packaging;

    /**
     * Logical path.
     * @type String
     */
    this.logicalPath = logicalPath;

    /**
     * Array of source file objects containing the source files to be included in this output file. Items should be
     * added or removed from this array only by calling setOutputFile on the source files. Changing the order can be
     * done directly.
     * @type Array
     */
    this.sourceFiles = [];

    /**
     * This property is updated with the complete output path just before the builder is called to build the output
     * file.
     * @type String
     */
    this.outputPath = null;

    /**
     * Contains an object able to create a package from the source files. It must have a build method, taking the output
     * file object as a parameter.
     * @type Object
     */
    this.builder = null;

    /**
     * Whether this output file was already built. It is set to true after being built.
     * @type Boolean
     */
    this.finished = false;
};

/**
 * Write this output file to the disk.
 */
OutputFile.prototype.build = function () {
    if (!this.builder) {
        this.builder = this.packaging.createObject(this.packaging.defaultBuilder, this.builtinBuilders);
        if (!this.builder) {
            grunt.log.error("No builder is defined for " + this.logicalPath.yellow);
            return;
        }
    }
    this.outputPath = path.join(this.packaging.outputDirectory, this.logicalPath);
    this.packaging.callVisitors('onBeforeOutputFileBuild', [this]);
    this.builder.build(this);
    this.packaging.callVisitors('onAfterOutputFileBuild', [this]);
    this.finished = true;
};

/**
 * Whether the logical path of this output file matches the given patterns.
 * @param {Array} patterns
 * @return {Boolean}
 */
OutputFile.prototype.isMatch = function (patterns) {
    return grunt.file.isMatch(patterns, [this.logicalPath]);
};

module.exports = OutputFile;

OutputFile.prototype.builtinBuilders = require("../atpackager").builders;
