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

var path = require("path");
var gruntReady = require("./grunt").ready;
var atpackager;

var callPlugin = function (plugin) {
    gruntReady(function () {
        plugin(atpackager);
    });
};

var loadPlugin = function (pluginFile) {
    var resolvedFile = path.resolve(pluginFile);
    var plugin = require(resolvedFile);
    callPlugin(plugin);
};

var loadNpmPlugin = function (npmModule) {
    var nodeModules = path.resolve("node_modules");
    var file = path.join(nodeModules, npmModule, "atpackager");
    loadPlugin(file);
};

module.exports = {
    initGrunt : function (grunt) {
        require("./grunt").init(grunt);
    },
    plugin : callPlugin,
    loadPlugin : loadPlugin,
    loadNpmPlugin : loadNpmPlugin
};

gruntReady(function () {
    atpackager = require("./atpackager");
});