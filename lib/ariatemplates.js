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

var createXMLHttpRequest = function () {};
var XMLHttpRequestProto = createXMLHttpRequest.prototype = {};

XMLHttpRequestProto.UNSENT = 0;
XMLHttpRequestProto.OPENED = 1;
XMLHttpRequestProto.HEADERS_RECEIVED = 2;
XMLHttpRequestProto.LOADING = 3;
XMLHttpRequestProto.DONE = 4;

XMLHttpRequestProto.abort = XMLHttpRequestProto.setRequestHeader = function () {};
XMLHttpRequestProto.getResponseHeader = function () {
    return null;
};
XMLHttpRequestProto.getAllResponseHeaders = function () {
    return "";
};
XMLHttpRequestProto._changeReadyState = function (state) {
    this.readyState = state;
    if (this.onreadystatechange) {
        this.onreadystatechange();
    }
};
XMLHttpRequestProto.open = function (method, url, async) {
    this.method = method;
    this.url = url;
    this.async = async;
    this._changeReadyState(this.OPENED);
};

XMLHttpRequestProto.send = function () {
    var responseText, status;
    var self = this;
    try {
        responseText = self._readLogicalPathSync.call(null, self.url);
        status = 200;
    } catch (err) {
        responseText = err + "";
        status = 404;
    }
    var loadResult = function () {
        self.status = status;
        self.statusText = status === 200 ? "OK" : "NOT FOUND";
        self.responseText = responseText;
        self._changeReadyState(self.DONE);
        self = responseText = loadResult = null;
    };
    if (this.async) {
        this._setTimeout(loadResult, 0);
    } else {
        loadResult();
    }
};

/**
 * Creates a node.js Javascript context to contain an instance of Aria Templates, and loads Aria Templates in it.
 * @param {String} ariaBootstrapFileName name of the file containing the Aria Templates bootstrap.
 * @param {Function} readLogicalPathSync synchronous function which will be used to read files on the disk (it is given
 * the logical path to read as its only parameter, and it should return the content of the file as a string or throw an
 * exception).
 * @param {Object} console object to be available as console in the context.
 * @return {Object} node.js context, suitable to be used with vm.runInContext. If there was no error during the
 * execution of this method, it should contain the Aria and aria properties giving access to the embedded Aria Templates
 * instance. An execTimeouts method is also available to call all currently registered timeouts in this javascript
 * context (which is useful to make calls to an Aria Templates asynchronous method synchronous in node).
 */
exports.createContext = function (ariaBootstrapFileName, readLogicalPathSync, console) {

    var vm = require('vm');

    var timeouts = [];
    var timeoutId = 0;

    var setTimeout = function (fn, delay) {
        timeoutId++;
        var id = "" + timeoutId;
        timeouts.push({
            id : id,
            fn : fn,
            delay : delay
        });
        return id;
    };
    var clearTimeout = function (id) {
        for (var i = 0, l = timeouts.length; i < l; i++) {
            var item = timeouts[i];
            if (item.id === id) {
                timeouts.splice(i, 1);
                return;
            }
        }
    };
    var document = {
        currentScript : null
    };

    var XMLHttpRequest = function () {};
    XMLHttpRequest.prototype = new createXMLHttpRequest();
    XMLHttpRequest.prototype._readLogicalPathSync = readLogicalPathSync;
    XMLHttpRequest.prototype._setTimeout = setTimeout;

    var atContext = vm.createContext({
        XMLHttpRequest : XMLHttpRequest,
        console : console,
        setTimeout : setTimeout,
        clearTimeout : clearTimeout,
        setInterval : setTimeout, // implements the setInterval method as a setTimeout (only call it once)
        clearInterval : clearTimeout,
        execTimeouts : function () {
            var l = timeouts.length;
            while (l > 0) {
                var minIndex = 0;
                for (var i = 1; i < l; i++) {
                    if (timeouts[i].delay < timeouts[minIndex].delay) {
                        minIndex = i;
                    }
                }
                var minItem = timeouts[minIndex];
                timeouts.splice(minIndex, 1);
                minItem.fn.call(atContext);
                // The function called at the previous line can add or remove items from timeouts, so it's necessary to
                // check again the length:
                l = timeouts.length;
            }
        },
        load : function (filePath) {
            var savedCurrentScript = document.currentScript;
            try {
                var fileContent = readLogicalPathSync(filePath);
                document.currentScript = {
                    src : filePath
                };
                vm.runInContext(fileContent, atContext, filePath);
            } catch (err) {
                console.error("Error while trying to execute " + filePath, err);
            } finally {
                document.currentScript = savedCurrentScript;
            }
        },
        Aria : {
            rootFolderPath : './'
        },
        document : document
    });

    atContext.load(ariaBootstrapFileName);

    return atContext;
};