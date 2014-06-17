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
var SourceFile = require('./sourceFile');
var OutputFile = require('./outputFile');
var path = require('path');
var fs = require('fs');
var findFile = require("../findFile");

/**
 * Represents a packaging, with a set of source files and destination files.
 */
var Packaging = function () {
    /**
     * Directories where logical paths are looked for.
     */
    this.sourceDirectories = [];

    /**
     * Map with information about each source file. The key in the map is the logical path of the file.
     */
    this.sourceFiles = {};

    /**
     * Directory in which packages are written.
     */
    this.outputDirectory = ".";

    /**
     * Map with information about each output file. The key in the map is the name of the output file, relative to
     * outputDirectory.
     */
    this.outputFiles = {};

    /**
     * Queue of output files to be built. Files will be built in this order. Already built files are not in this queue
     * any more.
     */
    this.outputFilesQueue = [];

    /**
     * Array of visitors.
     */
    this.visitors = [];

    /**
     * Default builder.
     */
    this.defaultBuilder = null;
};

/**
 * Calls the given method on all visitors with the given parameters.
 * @param {String} method name of the method to call on all visitors
 * @param {Array} args array of arguments to pass to visitors
 */
Packaging.prototype.callVisitors = function (method, args) {
    var visitors = this.visitors;
    args = args.slice(0);
    args.unshift(this); // adds the packaging as the first parameter for all methods
    for (var i = 0, l = visitors.length; i < l; i++) {
        var curVisitor = visitors[i];
        if (curVisitor[method]) {
            curVisitor[method].apply(curVisitor, args);
        }
    }
};

/**
 * Expands the given patterns of logical paths, using sourceDirectories to find them.
 * @param {String} patterns patterns to be expanded
 * @param {Boolean} onlyAlreadyAdded if true, only use already added source files
 * @return {Array} array of logical paths
 */
Packaging.prototype.expandLogicalPaths = function (patterns, onlyAlreadyAdded) {
    var file = grunt.file;
    var sourceFiles = Object.keys(this.sourceFiles);
    var res = file.match(patterns, sourceFiles);
    if (!onlyAlreadyAdded) {
        var sourceDirectories = this.sourceDirectories;
        for (var i = 0, l = sourceDirectories.length; i < l; i++) {
            res = res.concat(file.expand({
                filter : "isFile",
                cwd : sourceDirectories[i]
            }, patterns));
        }
    }
    return res;
};

/**
 * Returns an absolute path corresponding to a logical path. If the file does not exist, returns null.
 * @param {String} logicalPath logical path
 * @return {String} absolute path
 */
Packaging.prototype.getAbsolutePath = function (logicalPath) {
    return findFile(logicalPath, this.sourceDirectories);
};

/**
 * Add source files specified by patterns.
 * @param {Array} patterns
 */
Packaging.prototype.addSourceFiles = function (patterns) {
    var res = [];
    var files = this.expandLogicalPaths(patterns);
    for (var i = 0, l = files.length; i < l; i++) {
        var curFile = files[i];
        res[i] = this.addSourceFile(curFile);
    }
    return res;
};

/**
 * Add a source file specified by its logical path, if it is not already added. In all cases, returns the SourceFile
 * object.
 * @param {String} logicalPath
 * @param {Object}
 */
Packaging.prototype.addSourceFile = function (logicalPath, mustCreate) {
    logicalPath = path.normalize(logicalPath);
    var sourceFiles = this.sourceFiles;
    var res = sourceFiles[logicalPath];
    if (!res) {
        sourceFiles[logicalPath] = res = new SourceFile(this, logicalPath);
        this.callVisitors('onAddSourceFile', [res]);
    } else if (mustCreate) {
        throw new Error("Source file already present " + logicalPath);
    }
    return res;
};

/**
 * Returns the source file object with the given logical path (normalizing the path before), if it is present in the
 * packaging. Otherwise returns undefined.
 * @param {String} logicalPath
 * @return {Object}
 */
Packaging.prototype.getSourceFile = function (logicalPath) {
    logicalPath = path.normalize(logicalPath);
    return this.sourceFiles[logicalPath];
};

/**
 * Returns the output file object with the given logical path (normalizing the path before), if it is present in the
 * packaging. Otherwise returns undefined.
 * @param {String} logicalPath
 * @return {Object}
 */
Packaging.prototype.getOutputFile = function (logicalPath) {
    logicalPath = path.normalize(logicalPath);
    return this.outputFiles[logicalPath];
};

/**
 * Add an output file specified by its logical path, if it is not already added. In all cases, returns the OutputFile
 * object.
 * @param {String} logicalPath
 * @param {Object}
 */
Packaging.prototype.addOutputFile = function (logicalPath, mustCreate) {
    logicalPath = path.normalize(logicalPath);
    var outputFiles = this.outputFiles;
    var res = outputFiles[logicalPath];
    if (!res) {
        outputFiles[logicalPath] = res = new OutputFile(this, logicalPath);
        this.outputFilesQueue.push(res);
        this.callVisitors('onAddOutputFile', [res]);
    } else if (mustCreate) {
        throw new Error("Output file already present " + logicalPath);
    }
    return res;
};

/**
 * Adds a package to this packaging.
 * @param {Object} packageDesc package description
 */
Packaging.prototype.addPackage = function (packageDesc) {
    var logicalPath = packageDesc.name;
    var outputFile = this.addOutputFile(logicalPath);
    if (packageDesc.builder) {
        if (outputFile.builder) {
            throw new Error('A builder is already configured for ' + outputFile.logicalPath);
        }
        outputFile.builder = this.createObject(packageDesc.builder, outputFile.builtinBuilders);
    }
    if (packageDesc.files) {
        var files = this.addSourceFiles(packageDesc.files);
        files.forEach(function (sourceFile) {
            if (sourceFile.outputFile === outputFile) {
                return;
            }
            if (sourceFile.outputFile) {
                throw new Error(sourceFile.logicalPath + ' is configured to be both in ' +
                        sourceFile.outputFile.logicalPath + ' and ' + outputFile.logicalPath);
            }
            sourceFile.setOutputFile(outputFile);
        });
    }
};

/**
 * Renames an output file. This method can be called either before or after the file is built. If it is done before the
 * creation of the output file, the file will be directly created with the new name. If the file was already built, it
 * will also be renamed on the disk.
 */
Packaging.prototype.renameOutputFile = function (oldLogicalPath, newLogicalPath) {
    var outputFiles = this.outputFiles;
    oldLogicalPath = path.normalize(oldLogicalPath);
    var toBeRenamed = outputFiles[oldLogicalPath];
    if (!toBeRenamed) {
        throw new Error("Cannot rename " + oldLogicalPath + " to " + newLogicalPath + ": cannot find source file.");
    }
    newLogicalPath = path.normalize(newLogicalPath);
    if (oldLogicalPath !== newLogicalPath) {
        delete outputFiles[oldLogicalPath];
        toBeRenamed.logicalPath = newLogicalPath;
        outputFiles[newLogicalPath] = toBeRenamed;
        if (toBeRenamed.outputPath && fs.existsSync(toBeRenamed.outputPath)) {
            var newOutputPath = path.join(this.outputDirectory, newLogicalPath);
            fs.renameSync(toBeRenamed.outputPath, newOutputPath);
            toBeRenamed.outputPath = newOutputPath;
        }
    }
    return toBeRenamed;
};

/**
 * Call the onInit method on visitors. This method should be called before adding any source file or package and (of
 * course) after adding all visitors.
 */
Packaging.prototype.init = function () {
    this.callVisitors('onInit', []);
};

/**
 * Writes all the output files present in the queue.
 */
Packaging.prototype.build = function () {
    this.callVisitors('onBeforeBuild', []);
    var outputFilesQueue = this.outputFilesQueue;
    if (outputFilesQueue.length === 0) {
        this.callVisitors('onReachingBuildEnd', []);
    }
    while (outputFilesQueue.length > 0) {
        var outFile = outputFilesQueue.shift();
        grunt.verbose.writeln("Creating package " + outFile.logicalPath + "...");
        outFile.build();
        if (outputFilesQueue.length === 0) {
            this.callVisitors('onReachingBuildEnd', []);
        }
    }
    this.callVisitors('onAfterBuild', []);
};

/**
 * Creates an object according to its configuration.
 * @param {Object} cfg object configuration
 * @param {Object} builtinMap map of built-in object constructors
 * @return {Object}
 */
Packaging.prototype.createObject = function (cfg, builtinMap) {
    var cfgType = grunt.util.kindOf(cfg);
    if (cfgType === "string" || cfgType === "function") {
        cfg = {
            type : cfg
        };
    } else if (!cfg.type) {
        // already an instance
        return cfg;
    }
    if (!cfg.instance) {
        // instance already created
        if (grunt.util.kindOf(cfg.type) === "string") {
            cfg.type = builtinMap[cfg.type];
        }
        if (grunt.util.kindOf(cfg.type) !== "function") {
            throw new Error("Wrong configuration for createObject.");
        }
        cfg.instance = new cfg.type(cfg.cfg);
    }
    return cfg.instance;
};

/**
 * Adds the given visitors to this packaging.
 * @param {Array} visitorsArray array of visitors to add.
 */
Packaging.prototype.addVisitors = function (visitorsArray) {
    visitorsArray.forEach(function (visitorDesc) {
        if (visitorDesc) {
            var visitorObject = this.createObject(visitorDesc, this.builtinVisitors);
            this.visitors.push(visitorObject);
        }
    }, this);
};

/**
 * Adds the given packages to this packaging.
 * @param {Array} packagesArray array of packages to add. Arrays contained in this array will also be processed as
 * arrays of packages to add.
 */
Packaging.prototype.addPackages = function (packagesArray) {
    var self = this;
    var processPackages = function (packageDesc) {
        if (Array.isArray(packageDesc)) {
            packageDesc.forEach(processPackages);
        } else {
            self.addPackage(packageDesc);
        }
    };
    processPackages(packagesArray);
};

module.exports = Packaging;

Packaging.prototype.builtinVisitors = require("../atpackager").visitors;
