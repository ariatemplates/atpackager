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

module.exports = function (grunt) {
    require('../lib/grunt').init(grunt);

    var Packaging = require('../lib/packager/packaging');

    grunt.registerMultiTask('atpackager', 'Aria Templates packager', function () {
        try {
            var currentPackaging = new Packaging();

            var options = this.options({
                sourceDirectories : [],
                sourceFiles : [],
                outputDirectory : 'output',
                visitors : [],
                packages : [],
                defaultBuilder : null,
                ATBootstrapFile : 'aria/bootstrap.js',
                ATDirectories : []
            });

            currentPackaging.ATBootstrapFile = options.ATBootstrapFile;
            currentPackaging.ATDirectories = options.ATDirectories;
            currentPackaging.defaultBuilder = options.defaultBuilder;
            currentPackaging.sourceDirectories = options.sourceDirectories;
            currentPackaging.outputDirectory = options.outputDirectory;
            currentPackaging.addVisitors(options.visitors);
            currentPackaging.addSourceFiles(options.sourceFiles);
            currentPackaging.addPackages(options.packages);
            currentPackaging.build();
        } catch (e) {
            grunt.log.error(e);
            if (e.stack && grunt.option('stack')) {
                console.log(e.stack);
            }
            grunt.warn("An error interrupted atpackager.");
            return false;
        }

        if (this.errorCount > 0) {
            grunt.warn("There were " + this.errorCount + " error(s) while packaging.");
            return false;
        }

        grunt.log.ok();
    });
};
