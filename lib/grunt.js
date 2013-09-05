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

var grunt = null;
var listenersList = [];

/**
 * Sets the instance of grunt to be used everywhere in this plugin.
 * @param {Object} grunt
 */
exports.init = function (initGrunt) {
    if (initGrunt && grunt !== initGrunt) {
        if (grunt) {
            throw new Error("Trying to override the stored grunt instance.");
        }
        grunt = initGrunt;
        listenersList.forEach(function (listener) {
            listener(grunt);
        });
        listenersList = null;
    }
};

/**
 * Returns the stored instance of grunt.
 * @return {Object}
 */
exports.grunt = function () {
    if (!grunt) {
        throw new Error("Grunt is not yet defined.");
    }
    return grunt;
};

/**
 * Calls the listener when grunt is available (the listener is called synchronously if grunt is already available).
 * @param {Function} listener Function to be called when grunt is available. grunt is passed to the function as its
 * first parameter.
 */
exports.ready = function (listener) {
    if (grunt) {
        listener(grunt);
    } else {
        listenersList.push(listener);
    }
};
