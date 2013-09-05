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
var fileLoader = require('../contentProviders/fileLoader');
var textContent = require('../contentProviders/textContent');
var binaryContent = require('../contentProviders/binaryContent');

/**
 * This class represents a source file.
 * @param {Object} packaging Reference to the packaging this output file belongs to.
 * @param {String} logicalPath Logical path of this output file.
 */
var SourceFile = function (packaging, logicalPath) {
    /**
     * Reference to the packaging which contains this source file.
     */
    this.packaging = packaging;

    /**
     * Logical path.
     */
    this.logicalPath = logicalPath;

    /**
     * Object able to return the content of the file. It must have either a getTextContent method (returning a string)
     * or a getBinaryContent method (returning a buffer) to retrieve the content of the file or both methods. The
     * parameter passed to those methods is this object.
     */
    this.contentProvider = fileLoader;

    /**
     * Reference to the output file object. This property should only be changed by calling setOutputFile.
     */
    this.outputFile = null;

    /**
     * Array of other source file objects from the same packaging this source file is depending on. This is filled
     * and/or used by visitors.
     */
    this.dependencies = null;
};

/**
 * Set the destination file of this source file.
 * @param {Object} destinationFile
 */
SourceFile.prototype.setOutputFile = function (outputFile) {
    if (this.outputFile === outputFile) {
        return;
    }
    if (this.outputFile) {
        var srcFiles = this.outputFile.sourceFiles;
        var index = srcFiles.indexOf(srcFiles);
        srcFiles.splice(index, 1, 0);
    }
    this.outputFile = outputFile;
    if (outputFile) {
        outputFile.sourceFiles.push(this);
    }
};

/**
 * Returns the content of this source file as a string.
 * @return {String}
 */
SourceFile.prototype.getTextContent = function () {
    var contentProvider = this.contentProvider;
    if (contentProvider.getTextContent) {
        return contentProvider.getTextContent(this);
    } else {
        throw new Error("Text content not available!");
    }
};

/**
 * Returns the content of this source file as a buffer.
 * @return {Buffer}
 */
SourceFile.prototype.getBinaryContent = function () {
    var contentProvider = this.contentProvider;
    if (contentProvider.getBinaryContent) {
        return contentProvider.getBinaryContent(this);
    } else {
        throw new Error("Binary content not available!");
    }
};

/**
 * Replaces the content of this source file to be the given string. This change is done in memory only, not really
 * changing the source file, so this only affects this packaging.
 * @param {String} string
 */
SourceFile.prototype.setTextContent = function (string) {
    this.clearContent();
    this.contentProvider = textContent;
    this.contentProvider.setTextContent(this, string);
};

/**
 * Replaces the content of this source file to be the given buffer. This change is done in memory only, not really
 * changing the source file, so this only affects this packaging.
 * @param {Buffer} buffer
 */
SourceFile.prototype.setBinaryContent = function (buffer) {
    this.clearContent();
    this.contentProvider = binaryContent;
    this.contentProvider.setBinaryContent(this, buffer);
};

/**
 * Whether the logical path of this source file matches the given patterns.
 * @param {Array} patterns
 * @return {Boolean}
 */
SourceFile.prototype.isMatch = function (patterns) {
    return grunt.file.isMatch(patterns, [this.logicalPath]);
};

/**
 * Computes (if not already done) and returns the dependencies of this input file on other input files. Computing
 * dependencies basically means creating an empty array to contain the result, and calling 'computeDependencies' on all
 * visitors. Visitors should then call addDependency to add the computed dependencies.
 * @return {Array} array of input file objects
 */
SourceFile.prototype.getDependencies = function () {
    var res = this.dependencies;
    if (!res) {
        res = this.dependencies = [];
        this.packaging.callVisitors('computeDependencies', [this]);
    }
    return res;
};

/**
 * This method adds a dependency of this source file. It should be called from a visitor, from the 'computeDependencies'
 * method.
 * @param {Object} otherSourceFile Source file object this source file depends on.
 */
SourceFile.prototype.addDependency = function (otherSourceFile) {
    var dependencies = this.dependencies;
    var alreadyThere = dependencies.indexOf(otherSourceFile);
    if (alreadyThere === -1) {
        dependencies.push(otherSourceFile);
    }
};

/**
 * Clears all the content stored on this object. Content providers are supposed to store their content on this object,
 * prefixing the properties with "content". This method clears all the properties whose name starts with "content" on
 * this object.
 */
SourceFile.prototype.clearContent = function () {
    for (var key in this) {
        if (/^content/.test(key) && this.hasOwnProperty(key)) {
            delete this[key];
        }
    }
};

module.exports = SourceFile;

SourceFile.prototype.builtinContentProviders = require("../atpackager").contentProviders;
