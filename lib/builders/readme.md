Built-in builders.



# File system layout

* [`readme.md`](./readme.md): this current documentation file

General purpose specific builders:

* [`Copy.js`](./Copy.js): [Copy files](#copy-files)
* [`Concat.js`](./Concat.js): [Concatenate files](#concatenate-files)

JavaScript specific builders:

* [`JSConcat.js`](./JSConcat.js): [Concatenate JavaScript files](#concatenate-javascript-files)

Aria Templates specific builders:

* [`ATMultipart.js`](./ATMultipart.js): [Create an Aria Templates multi-part file](#create-an-aria-templates-multi-part-file)



----



# Introduction: what is a builder?

A builder is in charge to create the content of an output file (normally using its source files), store it in memory, and write it on the storage device.





# Some concepts

_Before going further into details, here are a few concepts to know, in order to understand some features, and also to avoid repeating things in the documentation, making it less digestible._

All builders expect a configuration object as the unique argument of their constructors; they are described in this documentation for each specific builder.

Note that the configuration object is not altered, its properties are simply used.





# Interface of a builder

## Methods



### Build

* Name: `build`

Main entry point of the builder to generate the content of the given output file.

__All builders implement this method.__

#### Parameters

1. `outputFile`
	* interface: `Output File`
	* __required__
	* __in & out__
	* The output file to build.





----

General purpose specific builders

----


# Copy files

* Name: `Copy`

Creates the output content by copying the content of one single file. This means that if the output file is configured with more than 1 source file the builder will log an error with grunt ([`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error)).

## Configuration

_No configuration expected_

## Description

The process is simple:

1. the unique source file description is retrieved
1. the content of the source file is about to be retrieved: visitors' method `onWriteInputFile` are called
1. the content of the source file is retrieved and temporary stored: the source file itself is cleared of its content afterwards
1. the content of the output file is about to be written: visitors' method `onWriteOutputFile` are called
1. the content of the output file is written, using the previously retrieved source file's content





# Concatenate files

* Name: `Concat`

Creates the output content by concatenating its input files' contents together, optionally adding a header at the beginning and a footer at the end.

This is an important builder, designed generically so that it is possible to inherit it to provide more specific builders.


## Configuration

* `outputEncoding`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding)
	* The encoding of the output file.
* `header`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* The header to put at the beginning of the output file.
* `footer`:
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* The footer to put at the end of the file.


## Description

The following describes the process done by the builder:

1. the `header` is written (if specified) to the output buffer
1. for each input file
	1. its content is about to be retrieved: visitors' `onWriteInputFile` method are called
	1. its content is retrieved and stored locally
	1. this content is added to the output buffer
	1. the input file's content is cleared
1. the `footer` is written (if specified) to the output buffer
1. the final content is generated as a single string from the output buffer
1. this content is about to be written: visitors' `onWriteOutputFile` method are called
1. this content is written to the output file



## Internal interfaces

### Out

* Name: `Out`
* Instances often referenced as `out`
* Often called _output_, or _out stream_

`Out`'s interface is in fact the `Array`. It is just intended to be used to gather a sequence of lines that will be joined together to produce a whole content. Simply alter the array to alter this content. At that level, changes' granularity is the line.



## Protected methods

Those methods are used from the `build` method, and can be overridden to create a new builder based on this one.



### Write header

* Name: `writeHeader`

Writes the header content at the beginning of the output.

#### Input

* `outputFile`:
	* interface: `File`
	* __required__
	* The output file.
* `out`:
	* interface: `Out`
	* __required__



### Write footer

* Name: `writeFooter`

Writes the footer content at the end of the output.

#### Input

* `outputFile`:
	* interface: `File`
	* __required__
	* The output file.
* `out`:
	* interface: `Out`
	* __required__



### Write input file

* Name: `writeInputFile`

Writes the given source file's content into the given output. Once done, the source file is cleared using `clearContent`.

#### Parameters

* `outputFile`:
	* interface: `Output File`
	* __required__
	* The output file.
* `sourceFile`:
	* interface: `Source File`
	* __required__
	* The source file.
* `out`:
	* interface: `Out`
	* __required__

#### Visitor

* `onWriteInputFile`: at the very beginning of the method



### Write output file

* Name: `writeOutputFile`

Actually writes the content of the output file on the disk.

Uses [`grunt.file.write`](http://gruntjs.com/api/grunt.file#grunt.file.write).

#### Input

* `outputFile`:
	* interface: `Output File`
	* __required__
	* The output file (used for its description).
* `content`:
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* The content to write into the given output file.
* `options`:
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object)
	* __required__
	* Options passed directly to the underlying write method.

#### Visitors

* `onWriteOutputFile`: right before the actual write operation is called
	* It can be used to alter the content to be written and/or the output options





# Concatenate JavaScript files

* Name: `JSConcat`

Creates the output content by concatenating and transforming its input files' JavaScript contents together, optionally adding a header at the beginning and a footer at the end.



## Configuration

### General

* `outputEncoding`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding)
	* The encoding of the output file.
* `header`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `""` (empty)
	* The header to put at the beginning of the output file.
* `footer`:
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `""` (empty)
	* The footer to put at the end of the file.

### JavaScript specific

* `jsOutputOptions`:
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object)
	* default: `{beautify : true, ascii_only : true, comments : true}`
	* Options to be passed to UglifyJS when converting the AST to a string.

Wrappers:

* `inputFileWrapper`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `"$CONTENT$"` (content is not wrapped)
	* Wrapper for input files. This should be some JS code containing the special $CONTENT$ keyword which will be replaced by the content of each input file.
* `outputFileWrapper`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `"$CONTENT$"` (content is not wrapped)
 	* Wrapper for the output file. This should be some JS code containing the special $CONTENT$ keyword which will be replaced by the content of the output file.

## Description

The process is the following:

1. for each source file of the output file
	1. its content is about to be retrieved: visitors' method `onWriteInputFile` are called
	1. its content is retrieved and stored locally
	1. its content is wrapped using `inputFileWrapper`
	1. its content is appended to a buffer
	1. the input file's content is cleared
1. the buffer previously filled is used as the JavaScript content (AST) for the output file
1. this content is wrapped using `outputFileWrapper`
1. the JavaScript content is about to be generated: visitors' method `onWriteJSOutputFile` are called
1. the JavaScript content (string) is generated
1. this content is wrapped by the provided `header` and `footer`
1. the final content is about to be written: visitors' method `onWriteOutputFile` are called
1. the content is written to the output file





# Create an Aria Templates Multi-part file

* Name: `ATMultipart`
* Inherits: `Concat`

This builder creates files in the Aria Templates multi-part format.



## Configuration

* `multipartBoundary`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `'*******************'`
	* Specifies the separator to use between files. This sequence should not appear in any of the files.


## Implemented methods

Note that nothing specific is done by this builder if there is only one source file configured for the output file. Thus, in this case it would behave exactly as the `Concat` builder.

Otherwise, here are the specificities added by the builder:

* `writeHeader`: after letting the initial `Concat`'s implementation write the provided header, this builder adds the following text: `//***MULTI-PART`
* `writeInputFile`: before letting the initial `Concat`'s implementation write the content of the input file, this builder adds the multi-part header, which has the following format:

```javascript

//{multipartBoundary}
//LOGICAL-PATH:{path}
//{multipartBoundary}

```

where:

* `{multipartBoundary}` is the one provided in configuration
* `{path}` is the logical path of the input file, with backslashes replaced by normal slashes
