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

var atCompiledTemplate = require('../contentProviders/ATCompiledTemplate');
var atGetDependencies = require('../ATGetDependencies');
var uglifyContentProvider = require('../contentProviders/uglifyJS');

var ATDependencies = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*'];
    this.mustExist = cfg.hasOwnProperty('mustExist') ? cfg.mustExist : true;
    this.externalDependencies = cfg.hasOwnProperty('externalDependencies') ? cfg.externalDependencies : [];
    this.unresolvedGlobalError = cfg.hasOwnProperty('unresolvedGlobalError') ? cfg.unresolvedGlobalError : false;
    this.unresolvedGlobalWarning = cfg.hasOwnProperty('unresolvedGlobalWarning') ? cfg.unresolvedGlobalWarning : true;
    this.uselessDependencyError = cfg.hasOwnProperty('uselessDependencyError') ? cfg.uselessDependencyError : false;
    this.uselessDependencyWarning = cfg.hasOwnProperty('uselessDependencyWarning') ? cfg.uselessDependencyWarning
            : false;
    this.atDependenciesOptions = {
        ignoreBuiltinGlobals : cfg.hasOwnProperty('ignoreBuiltinGlobals') ? cfg.ignoreBuiltinGlobals : true,
        includesWithGlobals : cfg.hasOwnProperty('includesWithGlobals') ? cfg.includesWithGlobals : false,
        resolvedGlobals : cfg.hasOwnProperty('resolvedGlobals') ? cfg.resolvedGlobals : [],
        checkGlobals : this.unresolvedGlobalError || this.unresolvedGlobalWarning || this.uselessDependencyError ||
                this.uselessDependencyWarning
    };
};

ATDependencies.prototype.computeDependencies = function (packaging, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var jsStringContent;
    if (atCompiledTemplate.getClassGeneratorFromLogicalPath(inputFile.logicalPath)) {
        // makes sure templates are already compiled or compile them if necessary
        jsStringContent = atCompiledTemplate.getCompiledTemplate(inputFile);
        if (jsStringContent == null) {
            grunt.log.error('ATDependencies: could not determine dependencies of ' + inputFile.logicalPath.yellow);
            return;
        }
    } else if (!inputFile.isMatch(['**/*.js'])) {
        // makes sure we only take into account AT files: templates and .js files
        return;
    }
    var mustExist = this.mustExist;
    var externalDependencies = this.externalDependencies;
    var ast = uglifyContentProvider.getAST(inputFile, jsStringContent);
    if (ast) {
        var logMethod;
        var depInfo = atGetDependencies(ast, this.atDependenciesOptions);
        if ((this.unresolvedGlobalWarning || this.unresolvedGlobalError) && depInfo.unresolvedGlobals.length > 0) {
            logMethod = this.unresolvedGlobalError ? "error" : "warn";
            grunt.log[logMethod](inputFile.logicalPath.yellow + " uses the following unresolved globals:\n - " +
                    depInfo.unresolvedGlobals.join("\n - "));
        }
        if ((this.uselessDependencyError || this.uselessDependencyWarning) && depInfo.uselessDependencies.length > 0) {
            logMethod = this.unresolvedGlobalError ? "error" : "warn";
            grunt.log[logMethod](inputFile.logicalPath.yellow +
                    " depends on the following files without using them (apparently):\n - " +
                    depInfo.uselessDependencies.join("\n - "));
        }
        depInfo.declaredDependencies.forEach(function (dependency) {
            var correspondingFile = packaging.getSourceFile(dependency);
            if (correspondingFile) {
                inputFile.addDependency(correspondingFile);
            } else if (mustExist && !grunt.file.isMatch(externalDependencies, [dependency])) {
                grunt.log.error(inputFile.logicalPath.yellow + " depends on " + dependency + " which cannot be found.");
            }
        });
    }
};

module.exports = ATDependencies;