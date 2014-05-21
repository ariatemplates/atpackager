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

var UglifyJS = require("uglify-js");

var getProperty = function (node, propertyName) {
    var properties = node.properties;
    for (var i = 0, l = properties.length; i < l; i++) {
        var curKeyValue = properties[i];
        if (curKeyValue instanceof UglifyJS.AST_ObjectKeyVal && curKeyValue.key === propertyName) {
            return curKeyValue;
        }
    }
};

var setJSONPropertyInAST = function (node, path, value) {
    if (!Array.isArray(path)) {
        path = path.split(".");
    } else {
        path = path.slice(0);
    }
    var curPropertyName = path.shift();
    var item = getProperty(node, curPropertyName);
    if (!item) {
        item = new UglifyJS.AST_ObjectKeyVal({
            key : curPropertyName
        });
        node.properties.push(item);
    }
    if (path.length === 0) {
        item.value = value;
    } else {
        if (!(item.value instanceof UglifyJS.AST_Object)) {
            item.value = new UglifyJS.AST_Object({
                properties : []
            });
        }
        setJSONPropertyInAST(item.value, path, value);
    }
};

module.exports = setJSONPropertyInAST;
