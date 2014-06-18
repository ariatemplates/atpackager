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

var ariatemplates = require('./ariatemplates');
var grunt = require('./grunt').grunt();
var slice = Array.prototype.slice;
var findFile = require("./findFile");

var replaceErrorStack = grunt.option('stack') ? function (arg) {
    if (arg.stack) {
        // display an exception
        return arg.stack;
    } else {
        return arg;
    }
} : function (arg) {
    return arg;
};

var logFunction = function (type, logObj, logFn) {
    return function (msg) {
        logObj[logFn].call(logObj, "[Aria Templates " + type + "] " + msg.yellow);
        console.log.apply(console, slice.call(arguments, 1).map(replaceErrorStack));
    };
};

var gruntConsole = {
    debug : logFunction('DEBUG'.grey, grunt.verbose, 'writeln'),
    info : logFunction('INFO'.grey, grunt.verbose, 'writeln'),
    log : logFunction('LOG'.grey, grunt.log, 'writeln'),
    warn : logFunction('WARN'.yellow, grunt.log, 'writeln'),
    error : logFunction('ERROR'.red, grunt.log, 'error')
};

/**
 * Makes sure an Aria Templates context is initialized for the given packaging (or initializes it), and returns the Aria
 * Templates context.
 * @param {Object} packaging
 * @return {Object} Aria Templates context.
 */
exports.getATContext = function (packaging) {
    if (!packaging.atContext) {
        var searchDirectories = packaging.ATDirectories.concat(packaging.sourceDirectories);
        packaging.atContext = ariatemplates.createContext({
            bootstrapFile : packaging.ATBootstrapFile,
            readFileSync : function (logicalPath) {
                var path = findFile(logicalPath, searchDirectories);
                if (path == null) {
                    throw new Error("Cannot find " + logicalPath);
                }
                return grunt.file.read(path);
            },
            console : gruntConsole,
            debugMode : packaging.ATDebug
        });
        packaging.atContext.aria.core.AppEnvironment.setEnvironment(packaging.ATAppEnvironment, null, true);
    }
    return packaging.atContext;
};
