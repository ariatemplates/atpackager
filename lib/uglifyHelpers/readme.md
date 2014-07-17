# File system layout

* [`readme.md`](./readme.md): this current documentation file

Functions:

* [`astToString.js`](./astToString.js): [Convert an AST to a string](#convert-an-ast-to-a-string)
* [`cloneNode.js`](./cloneNode.js): [Clone a node](#clone-a-node)
* [`getExpression.js`](./getExpression.js): [Get a possible expression from a node](#get-a-possible-expression-from-a-node)
* [`jsToAST.js`](./jsToAST.js): [Generate an AST from a JavaScript Object](#generate-an-ast-from-a-javascript-object)
* [`replaceNode.js`](./replaceNode.js): [Replace/remove a child node in/from a given parent](#replaceremove-a-child-node-infrom-a-given-parent)
* [`setJSONPropertyInAST.js`](./setJSONPropertyInAST.js): [Set an object's property's value directly in its AST representation](#set-an-objects-propertys-value-directly-in-its-ast-representation)
* [`wrapCode.js`](./wrapCode.js): [Wrap code](#wrap-code)





# Introduction

As the package's name stands, here is a set of helpers for [UglifyJS](http://marijnhaverbeke.nl//uglifyjs). They aim at simplifying the use of features provided by the latter.


----


# Convert an AST to a string

After applying the given options, generates a string from the given UglisyJS AST using its method `print_to_string`.

## Parameters

1. `ast`
	* interface: UglifyJS AST
	* __required__
	* __in & out__
	* The AST to use to generate a string representation.
1. `outputOptions`
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object), see [below](#description) for a list of available options
	* default: `{}`
	* __in__
	* The options to customize the output string.

## Description

Here are the possible options for `outputOptions`:

* `comments`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: falsy
	* If truthy, removes the following properties (if they exist) from every node of the AST, before the serialization: `node.start._comments_dumped`, `node.end._comments_dumped`


## Return value

* interface: [`String`](http://devdocs.io/javascript/global_objects/string)

The AST as a string.





# Clone a node

Clones the given node's associated subtree, and returns this clone's root.

## Parameters

1. `node`
	* interface: UglifyJS Node
	* __required__
	* __in__
	* The node to clone.

## Return value

* interface: UglifyJS Node

The copied node.





# Get a possible expression from a node

Tries to return an expression node taken from inside the given node, and returns it if found, otherwise throws an exception.

## Parameters

1. `node`
	* interface: UglifyJS Node
	* __required__
	* __in__
	* The node to extract the expression from.

## Description

The given node can be of two types:

* `UglifyJS.AST_Toplevel`: the expression is searched inside the first element of its `body` (using our own function), if it exists
* `UglifyJS.AST_SimpleStatement`: the expression is its `body`

## Return value

* interface: UglifyJS Node

The expression if found.

## Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

Thrown if the given node is not of one of the types described above.





# Generate an AST from a JavaScript Object

Generates an AST from the given object, throwing an exception if it doesn't know how to handle its type.

## Parameters

* `object`
	* type: one of the types listed in description
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* __in__
	* The value from which to create the AST.

## Description

The way to generate an AST depends on the object's type. The latter is checked using the empiric method of applying the native [`Object`](http://devdocs.io/javascript/global_objects/object)'s `toString` implementation on the object, so you can expect having an implementation for the following types:

* [`Array`](http://devdocs.io/javascript/global_objects/array)
* [`RegExp`](http://devdocs.io/javascript/global_objects/regexp)
* [`Date`](http://devdocs.io/javascript/global_objects/date)
* [`String`](http://devdocs.io/javascript/global_objects/string)
* [`Number`](http://devdocs.io/javascript/global_objects/number)
* [`Undefined`](http://devdocs.io/javascript/global_objects/undefined)
* [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
* [`Null`](http://devdocs.io/javascript/global_objects/null)
* [`Object`](http://devdocs.io/javascript/global_objects/object)
* [`Function`](http://devdocs.io/javascript/global_objects/function)

## Return value

* interface: UglifyJS AST

The generated AST.

The actual type of AST returned by the method depends on both the type of the input object and its actual value in some cases. However, this should not matter, since this could theoretically evolve without warning, what matters is that you get an AST object.

## Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

For any other type than the one listed above, an exception is thrown.





# Replace/remove a child node in/from a given parent

## Parameters

1. `node`
	* interface: UglifyJS Node
	* __required__
	* __in__
	* The node to replace.
1. `parent`
	* interface: UglifyJS Node
	* __required__
	* __in & out__
	* The parent node containing the node to replace and that will therefore receive the new node.
1. `newNode`
	* interface: UglifyJS Node
	* default: void
	* __in__
	* The node to use to replace the given node inside the given parent. If void, will delete the node instead.

## Description

It handles both nodes stored directly as properties of the parent or in an array.

## Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

Thrown if the given node cannot be found in given parent node.





# Set an object's property's value directly in its AST representation

## Parameters

1. `node`
	* interface: UglifyJS Node
	* __required__
	* __in & out__
	* The root node from which the property is accessed, directly or by traversing some sub-objects.
1. `path`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string) or [`Array`](http://devdocs.io/javascript/global_objects/array)
	* __required__
	* __in__
	* The path of the property. It can be given as an array of path portions (a sequence of property names), or as a string containing those portions separated by a single dot `.`.
1. `value`
	* interface: can be anything
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* __in__
	* The value to use to replace the property's one.

## Description

Here, _setting_ means actually making the property exist with the given value, whether it was existing before with a different one, or if it has to be created.

It will create a set of objects if needed along the property's path, possibly replacing some existing values if they were not objects before.

## Example

```javascript
object = {
	one: 1
};
setJSONPropertyInAST(object, "one.two.three"):
equivalent = {
	one: {
		two: {
			three: undefined
		}
	}
}
```





# Wrap code

## Parameters

1. `wrapper`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* Source code used to wrap the given statements.
1. `statements`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of `UglifyJS.AST_Node` (a single `UglifyJS.AST_Node` will automatically be wrapped in an array)
	* __required__
	* __in & out__
	* ???

## Description

???

## Return value

* interface: UglifyJS AST

The AST built form the given wrapper code, and the given statements injected inside the former.
