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

var isCommonJS = function (ast) {
    ast.figure_out_scope({
        screw_ie8: false
    });
    var globalRequire = ast.globals.get("require");
    return !! (globalRequire && globalRequire.undeclared);
};

var ATDependencies = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*'];
    this.mustExist = cfg.hasOwnProperty('mustExist') ? cfg.mustExist : true;
    this.externalDependencies = cfg.hasOwnProperty('externalDependencies') ? cfg.externalDependencies : [];
    this.detectCommonJS = cfg.hasOwnProperty('detectCommonJS') ? cfg.detectCommonJS : true;
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
        var commonJS = this.detectCommonJS ? isCommonJS(ast) : false;
        if (commonJS) {
            // if the CommonJS syntax is used for dependencies,
            // it is useless to call atGetDependencies
            grunt.verbose.writeln('ATDependencies: ' + inputFile.logicalPath.yellow + ' uses the CommonJS syntax');
        } else {
            var dependencies = atGetDependencies(ast);
            dependencies.forEach(function (dependency) {
                var correspondingFile = packaging.getSourceFile(dependency);
                if (correspondingFile) {
                    inputFile.addDependency(correspondingFile);
                } else if (mustExist && !grunt.file.isMatch(externalDependencies, [dependency])) {
                    grunt.log.error(inputFile.logicalPath.yellow + " depends on " + dependency + " which cannot be found.");
                }
            });
        }
    }
};

module.exports = ATDependencies;
