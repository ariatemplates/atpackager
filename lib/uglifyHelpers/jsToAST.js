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
var toString = Object.prototype.toString;
var operationByType = {
    "[object Array]" : function (object) {
        return new UglifyJS.AST_Array({
            elements : object.map(jsToAST)
        });
    },
    "[object RegExp]" : function (object) {
        return new UglifyJS.AST_RegExp({
            value : object
        });
    },
    "[object Date]" : function (object) {
        return new UglifyJS.AST_New({
            expression : new UglifyJS.AST_SymbolRef({
                name : "Date"
            }),
            args : [jsToAST(object.getTime())]
        });
    },
    "[object String]" : function (object) {
        return new UglifyJS.AST_String({
            value : object
        });
    },
    "[object Number]" : function (object) {
        if (isNaN(object)) {
            return new UglifyJS.AST_NaN();
        } else if (!isFinite(object)) {
            if (object > 0) {
                return new UglifyJS.AST_Infinity();
            } else {
                return new UglifyJS.AST_UnaryPrefix({
                    operator : "-",
                    expression : new UglifyJS.AST_Infinity()
                });
            }
        } else {
            return new UglifyJS.AST_Number({
                value : object
            });
        }
    },
    "[object Undefined]" : function () {
        return new UglifyJS.AST_Undefined();
    },
    "[object Boolean]" : function (object) {
        return object ? new UglifyJS.AST_True() : new UglifyJS.AST_False();
    },
    "[object Null]" : function () {
        return new UglifyJS.AST_Null();
    },
    "[object Object]" : function (object) {
        var properties = [];
        for (var key in object) {
            properties.push(new UglifyJS.AST_ObjectKeyVal({
                key : key,
                value : jsToAST(object[key])
            }));
        }
        return new UglifyJS.AST_Object({
            properties : properties
        });
    },
    "[object Function]" : function (object) {
        var getExpression = require("./getExpression");
        return getExpression(UglifyJS.parse("(" + object + ")"));
    }
};

var jsToAST = function (object) {
    var type = toString.call(object);
    var operation = operationByType[type];
    if (operation) {
        return operation(object);
    }
    throw new Error("Unexpected type of object " + type);
};

module.exports = jsToAST;
