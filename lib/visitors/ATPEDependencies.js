/*
 * Copyright 2015 Amadeus s.a.s.
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

var vm = require("vm");
var grunt = require('../grunt').grunt();

var evalJsonString = function (code) {
    // note that JSON.parse is too strict compared to the Aria Templates eval
    return vm.runInNewContext("(" + code + ")");
};

var classpathToLogicalPath = function (classpath, extension) {
    return classpath.split(".").join("/") + extension;
};

var getJsonDependencies = function (json) {
    var dependencies = [];

    var processModules = function (modulesMap) {
        if (!modulesMap) {
            return;
        }
        for (var key in modulesMap) {
            if (modulesMap.hasOwnProperty(key)) {
                var curModule = modulesMap[key];
                dependencies.push(classpathToLogicalPath(curModule.classpath, ".js"));
            }
        }
    };

    var processPlaceholder = function (placeholder) {
        if (typeof placeholder == "object") {
            if (placeholder.constructor.isArray) {
                placeholder.forEach(processPlaceholder);
            } else {
                dependencies.push(classpathToLogicalPath(placeholder.template, ".tpl"));
            }
        }
    };

    if (json.pageComposition) {
        // page definition
        processModules(json.pageComposition.modules);
        var placeholdersMap = json.pageComposition.placeholders;
        for (var placeholder in placeholdersMap) {
            if (placeholdersMap.hasOwnProperty(placeholder)) {
                processPlaceholder(placeholdersMap[placeholder]);
            }
        }
        dependencies.push(classpathToLogicalPath(json.pageComposition.template, ".tpl"));
    } else if (json.containerId) {
        // site configuration
        processModules(json.commonModules);
    }
    return dependencies;
};

var ATPEDependencies = function (cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.json'];
    this.mustExist = cfg.hasOwnProperty('mustExist') ? cfg.mustExist : true;
    this.externalDependencies = cfg.hasOwnProperty('externalDependencies') ? cfg.externalDependencies : [];
};

ATPEDependencies.prototype.computeDependencies = function (packaging, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }

    var mustExist = this.mustExist;
    var externalDependencies = this.externalDependencies;
    var textContent = inputFile.getTextContent();
    try {
        var jsonContent = evalJsonString(textContent);
        var dependencies = getJsonDependencies(jsonContent);
        dependencies.forEach(function (dependency) {
            var correspondingFile = packaging.getSourceFile(dependency);
            if (correspondingFile) {
                inputFile.addDependency(correspondingFile);
            } else if (mustExist && !grunt.file.isMatch(externalDependencies, [dependency])) {
                grunt.log.error(inputFile.logicalPath.yellow + " depends on " + dependency + " which cannot be found.");
            }
        });
    } catch (error) {
        grunt.log.error("ATPEDependencies: error when processing " + inputFile.logicalPath.yellow + ": " + error);
    }
};

module.exports = ATPEDependencies;