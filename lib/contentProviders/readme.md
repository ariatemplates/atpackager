Built-in content providers.

# File system layout

* [`readme.md`](./readme.md): this current documentation file

Content providers:

* [`binaryContent.js`](./binaryContent.js): [Binary content](#binary-content)
* [`textContent.js`](./textContent.js): [Text content](#text-content)
* [`fileLoader.js`](./fileLoader.js): [File loader](#file-loader)
* [`ATCompiledTemplate.js`](./ATCompiledTemplate.js): [Aria Templates compiled templates](#aria-templates-compiled-templates)
* [`uglifyJS.js`](./uglifyJS.js): [UglifyJS](#uglifyjs)

The content providers defined here are classes (technically the constructor functions) directly set on modules' `exports` property.

# Introduction: what is a content provider?

As its name stands, a content provider is something that is able to retrieve the content of a given object.

In our case, content providers deal with `Source File` objects, and with binary and text content types.

# Interface of a content provider

## Methods

### Get content

* `getTextContent`: gets the content as text
* `getBinaryContent`: gets the content as a buffer

At least one of the two is required, but a content provider might implement both.

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in & out__
	* The source file used to retrieve the content: it can either have enough information to fetch the content from outside, or directly store this content as a property.

#### Description

The content can be retrieved by any technique. Some content providers might even assume that this content had already been fetched (probably by another content provider), and then just get the stored value.

The content provider might choose to store the content it retrieved directly into a property of the source file object. In that case, the name of the property must begin with the exact following text: `content`.

#### Return value

* interface: [`String`](http://devdocs.io/javascript/global_objects/string) for text content, Node.js [`Buffer`](http://devdocs.io/node/buffer#buffer_class_buffer) for binary content

The content of the input.

### Set content

* `setTextContent`: sets the content as text
* `setBinaryContent`: sets the content as a buffer
* _No return value_

Those methods are fully optional. Also, a content provider might implement both.

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in & out__
	* The source file used to apply the content: it can either describe how to do it, or directly receive this content.
1. `textContent` for text content, `buffer` for binary content
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string) for text content, Node.js [`Buffer`](http://devdocs.io/node/buffer#buffer_class_buffer) for binary content
	* __required__
	* __in__
	* The content to apply to the source file.

#### Description

The content provider might choose to store the content it receives directly into a property of the source file object. In that case, the name of the property must begin with the exact following text: `content`.





----

Basic content providers.



# Binary content

Implements:

* `getBinaryContent`: returns the value of the property `contentBinary`. This means that there is no process of retrieving the content externally, it must have been set before.
* `setBinaryContent`: sets the property `contentBinary` with given value.

# Text content

Implements:

* `getTextContent`: returns the value of the property `contentText`. This means that there is no process of retrieving the content externally, it must have been set before.
* `setTextContent`: sets the property `contentText` with given value.

# File loader

Implements:

* `getTextContent`
* `getBinaryContent`

It uses [`grunt.file`](http://gruntjs.com/api/grunt.file) utility to read the content of the file from the storage interface. In the case of binary content, it is read as is, while in the case of text content the specified encoding is the one stored in [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding) property.

In both cases, before the content is returned, it is stored in the given source file object, using either the binary content provider in case of binary content or the text content provider in case of text content.

Note that the actual path used to read the content of the file is fetched by calling the prototype method [`getLoadPath`](#get-the-load-path-of-a-source-file).

## Prototype methods

### Set the load path of a source file

Stores the given load path into the given source file, for later use.

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in & out__
	* The source file for which the load path is given.
1. `path`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The path to use to load the content of the given source file.

### Get the load path of a source file

Returns the load path to be used for the given source file.

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in & out__
	* The source file for which the load path is requested.

#### Description

If the load path was specified earlier (using prototype method [`setLoadPath`](#set-the-load-path-of-a-source-file)), this value is directly returned (to be exact it is returned if it is truthy).

Otherwise, the path is computed using source file's associated packaging object, calling the latter's method `getAbsolutePath`, passing the value of the logical path of the source file. In short, in resolves the absolute path of the source file against the path of the packaging in which it is contained.

#### Return value

* interface: [`String`](http://devdocs.io/javascript/global_objects/string)

The load path of the source file, either previously stored or freshly computed.





----

Specific content providers.



# Aria Templates compiled templates

Implements:

* `getTextContent`: gets the file's content set by prototype method [`compile`](#compile-the-content-of-a-file) (so it must be called before)

## Content type

This content provider stores its content in a property called `contentATCompiledTemplate`, as a [`String`](http://devdocs.io/javascript/global_objects/string).



## Prototype methods



### Compile the content of a file

* Name: `compile`
* _No return value_

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in & out__
	* The input file corresponding to the content to compile.
1. `fileContent`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: gets content from given `inputFile` by calling its method `getTextContent`.
	* __in__
	* The content to compile.
1. `logicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: defaults to the given `inputFile`'s `logicalPath`
	* __in__
	* The path of the file, overriding the one present in the latter if specified.

#### Description

Compiles the given or retrieved text content - which should correspond to an Atlas template - into a JavaScript class.

Since there are multiple types of templates, it must use the proper compiler for the given content. It uses the prototype method [`getClassGeneratorFromLogicalPath`](#get-the-name-of-the-class-generator-for-a-given-template) to retrieve the name of the proper compiler class.

The result is stored as content (see content type).

Note that this method considers it has already been called before (or its job has been done) if the content of the file looks like a compiled template already: if the content begins with an arbitrary number of spaces, followed by the text `Aria.classDefinition`. In this case, it aborts its execution.



### Get the name of the class generator for a given template

* Name: `getClassGeneratorFromLogicalPath`

#### Parameters

1. `logicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The path of the file corresponding to the template to compile (the relevant part is actually the extension)

#### Description

The method returns the the classpath of the class to use to compile a template under the given path. The actual relevant information for that is the type of the template, and to guess it at best it uses the extension of the name of the template.

The extension is the part of the (base) name of the file (so folders excluded) after the first encountered dot (`.`).

Here is the list of classpaths per extension:

* `tpl`: `aria.templates.TplClassGenerator`
* `tpl.css`: `aria.templates.CSSClassGenerator`
* `tml`: `aria.templates.TmlClassGenerator`
* `tpl.txt`: `aria.templates.TxtClassGenerator`
* `cml`: `aria.templates.CmlClassGenerator`

#### Return value

* interface: [`String`](http://devdocs.io/javascript/global_objects/string)

Returns the classpath of the class to use to compile the template, or [`null`](http://devdocs.io/javascript/global_objects/null) if not found.



### Get the content

* Name: `getCompiledTemplate`
* Parameters: see prototype method [`compile`](#compile-the-content-of-a-file)
* Return value: see content type

Returns the content of the file as the prototype method `getTextContent` would do, however if the latter doesn't exist yet it calls the prototype method [`compile`](#compile-the-content-of-a-file) to compute it (forwarding all arguments), before eventually returning it.





# UglifyJS

Implements:

* `getTextContent`: gets the file's content set by prototype method [`parse`](#parse-the-content-of-a-source-file) (so it must be called before), and converts it to a string using the utility [astToString](../uglifyHelpers/astToString.js)

## Content type

This content provider stores its content in a property called `contentUglifyJS`, with the following properties:

* `ast`
	* interface: UglifyJS AST
	* default: [`null`](http://devdocs.io/javascript/global_objects/null)
	* AST corresponding to the text content of the source file to which this current content corresponds.
* `outputOptions`
	* interface: as expected by utility method [astToString](../uglifyHelpers/astToString.js)'s second parameter
	* default: `{beautify: true, ascii_only: true, comments: true}`
	* Options to convert the result of the parsing to a string: this is not used by this method, simply stored for external, later use.



## Prototype methods



### Parse the content of a source file

* Name: `parse`
* _No return value_

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in & out__
	* The input file corresponding to the content to parse.
1. `fileContent`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: gets content from given `inputFile` by calling its method `getTextContent`.
	* __in__
	* The content to parse.
1. `outputOptions`: __see content type documentation__
	* __in__

#### Description

Parses the `fileContent` (either passed or retrieved) using UglifyJS, specifying `inputFile`'s logical path.

If the parsing fails, the AST is set to [`null`](http://devdocs.io/javascript/global_objects/null) and an error is logged using grunt.

The resulting AST and the final `outputOptions` are stored as content of the file (see content type).



### Get the AST of a file content

* Name: `getAST`
* __Parameters__: same as for the [parsing method](#parse-the-content-of-a-source-file)

Returns the AST associated to the given content.

#### Description

Either returns the AST stored in the given `inputFile`'s content if present, or computes it using the prototype method `[`parse`](#parse-the-content-of-a-source-file), forwarding all the given parameters, and then returns it.

#### Return value

* interface: UglifyJS AST

The AST corresponding to the given content or given file's content.



### Set the AST of a file

* Name: `setAST`
* _No return value_

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in & out__
	* The input file to which the given AST corresponds.
1. `ast`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The AST corresponding to the content of file.
1. `outputOptions`: __see content type documentation__
	* default: void
	* __in__

#### Description

Stores the given AST in given `inputFile`'s content.

If the content object didn't exist already, this method creates it with given values.

Otherwise, this method overrides its properties with the given ones:

* `ast`: unconditionally
* `outputOptions`: only if given value is not falsy (not void)



### Get the output options of a file

* Name: `getOutputOptions`

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in__
	* The input file for which the output options are requested.

#### Return value

* interface: see content type

The output options stored in given file's content. Note that the content object must exist!



### Set the output options of a file

* Name: `setOutputOptions`
* _No return value_

Sets the output options in given file's content with given value, or default one.

Note that the content object must exist!

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* __required__
	* __in__
	* The input file receiving the given output options.
1. `outputOptions`: see content type
	* interface: see content type
	* default: see content type
	* __in__
