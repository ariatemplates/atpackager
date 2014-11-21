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

var CheckDependencies = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*'];
    this.noCircularDependencies = cfg.hasOwnProperty('noCircularDependencies') ? cfg.noCircularDependencies : true;
    this.addUnpackagedDependencies = cfg.hasOwnProperty('addUnpackagedDependencies') ? cfg.addUnpackagedDependencies : true;
    this.unpackagedDependenciesError = cfg.hasOwnProperty('unpackagedDependenciesError') ? cfg.unpackagedDependenciesError : true;
    this.checkPackagesOrder = cfg.hasOwnProperty('checkPackagesOrder') ? cfg.checkPackagesOrder : true;
    this.reorderFiles = cfg.hasOwnProperty('reorderFiles') ? cfg.reorderFiles : true;
};

CheckDependencies.prototype.onBeforeOutputFileBuild = function (packaging, outputFile) {
    if (!outputFile.isMatch(this.files)) {
        return;
    }

    // check the order of dependencies and add unpackaged ones
    var currentPackageOrder = [];
    var currentPackageFiles = {};
    var circularDependencies = {};// to detect circular dependencies
    var addUnpackagedDependencies = this.addUnpackagedDependencies;
    var noCircularDependencies = this.noCircularDependencies;
    var checkPackagesOrder = this.checkPackagesOrder;
    var unpackagedDependenciesError = this.unpackagedDependenciesError;
    var packagesOrderMessages = {};

    var processDependency = function (dependentFile, inputFile) {
        var logicalPath = inputFile.logicalPath;
        if (circularDependencies.hasOwnProperty(logicalPath)) {
            if (noCircularDependencies) {
                grunt.log.error('Circular dependency detected:\n - ' + Object.keys(circularDependencies).join('\n - '));
            }
            return;
        }
        if (currentPackageFiles.hasOwnProperty(logicalPath)) {
            return;
        }
        if ((inputFile.outputFile != null && inputFile.outputFile !== outputFile)) {
            if (checkPackagesOrder && !inputFile.outputFile.finished &&
                    !packagesOrderMessages.hasOwnProperty(inputFile.outputFile.logicalPath)) {
                packagesOrderMessages[inputFile.outputFile.logicalPath] = true; // don't display the same message twice
                grunt.log.error(dependentFile.logicalPath.yellow + " inside " + outputFile.logicalPath.yellow +
                        " depends on " + logicalPath.yellow + " inside " + inputFile.outputFile.logicalPath.yellow +
                        " which is built after.");
            }
            return;
        }
        if (!addUnpackagedDependencies && !inputFile.outputFile) {
            if (unpackagedDependenciesError) {
                grunt.log.error(dependentFile.logicalPath.yellow + " inside " + outputFile.logicalPath.yellow +
                        " depends on " + logicalPath.yellow + " which is not packaged.");
            }
            return;
        }
        circularDependencies[logicalPath] = inputFile;
        inputFile.getDependencies().forEach(processDependency.bind(null, inputFile));
        delete circularDependencies[logicalPath];
        currentPackageFiles[logicalPath] = inputFile;
        if (!inputFile.outputFile) {
            grunt.verbose.writeln("Adding " + logicalPath.yellow + " in dependent package " +
                    outputFile.logicalPath.yellow + " (depended on by " + dependentFile.logicalPath.yellow + ")");
            inputFile.setOutputFile(outputFile);
        }
        currentPackageOrder.push(inputFile);

    };
    outputFile.sourceFiles.forEach(processDependency.bind(null, null));

    if (this.reorderFiles) {
        outputFile.sourceFiles = currentPackageOrder;
    }
};

module.exports = CheckDependencies;