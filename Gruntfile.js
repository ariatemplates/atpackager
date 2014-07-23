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
    var pkg = require('./package.json');
    var doc = require('./build/doc');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-markdown');

    grunt.initConfig({
        jshint : {
            options : {
                eqnull : true,
                node : true,
                strict : false,
                undef : true,
                unused : true,
                curly : true
            },
            files : ['lib/**/*.js', 'tasks/**/*.js']
        },

        copy: {
            doc: {
                files: [{
                    expand: true,
                    cwd: 'doc',
                    src: ['**', '!**/*.md'],
                    dest: 'dist/doc'
                }]
            }
        },
        markdown: {
            doc: {
                options: {
                    template: "tasks/templates/documentation.html",
                    preCompile: doc.preCompile,
                    postCompile: doc.postCompile,
                    markdownOptions: {
                        highlight: doc.highlight,
                        gfm: true
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'doc',
                    src: ['**/*.md', '!README.md'],
                    dest: 'dist/doc',
                    ext: '.html'
                }]
            }
        }
    });

    grunt.registerTask('test', ['jshint']);
    grunt.registerTask('doc', ['copy:doc', 'markdown:doc']);
    grunt.registerTask('default', ['test', 'doc']);
};