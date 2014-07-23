title: Builders
page: builders
---
Builders are components which actually build the packages.

A builder takes a package configuration, and builds its corresponding output file from the specified set of input files. Please refer to the [configuration article](./configuration.html) for more information about the packages specifications.

All builders can potentially expect a configuration object.

There are [built-in builders](#built-in-builders), but you can also [create custom ones or use custom builders from other libraries](#create-custom-builders).


# Built-in builders

General purpose builders:

* [Copy files](#copy-files-copy-)
* [Concatenate files](#concatenate-files-concat-)

JavaScript specific builders:

* [Concatenate JavaScript files](#concatenate-javascript-files-jsconcat-)

Aria Templates specific builders:

* [Create an Aria Templates multi-part file](#create-an-aria-templates-multi-part-file-atmultipart-)



# Copy files: `Copy`

_No configuration expected_

Creates the output content by copying the content of one single file. This means that if the package is configured with more than 1 source file the builder will log an error with grunt ([`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error)).

The copy of the content is done in two steps: first the content is retrieved from the source file, then it is written to the output file. This split allows to hook the process with visitors, with possible modification of the content or output options. Here is the full process:

1. visitors: `onWriteInputFile`
1. content retrieved
1. visitors: `onWriteOutputFile`
1. content written




# Concatenate files: `Concat`

Creates the output content by concatenating its source files' contents together, optionally adding a header at the beginning and a footer at the end.

## Configuration

* `outputEncoding`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding): the encoding of the output file.
* `header`, [`String`](http://devdocs.io/javascript/global_objects/string), optional: the header to put at the beginning of the output file.
* `footer`, [`String`](http://devdocs.io/javascript/global_objects/string), optional: the footer to put at the end of the file.

## Build process

The parts of the content are queued before being actually written to the output file, allowing for hooking with visitors.

1. `header` queued (if specified)
1. for each source file
	1. visitors: `onWriteInputFile`
	1. content retrieved and queued
1. `footer` queued (if specified)
1. content generated from the queue
1. visitors: `onWriteOutputFile`
1. content written





# Concatenate JavaScript files: `JSConcat`

This builder works similarly to `Concat`, however the content is considered as JavaScript, allowing for more specific processing.

The content is not represented as a string but rather as an AST, until the end when it is generated back to a string, applying the given options.

Before the content is generated, it is possible to wrap it with some JavaScript code. This holds for each input file individually and also for the output file afterwards.

## Configuration

* The options `outputEncoding`, `header` and `footer` are the same as for `Concat`
* `jsOutputOptions`, [`Object`](http://devdocs.io/javascript/global_objects/object), defaults to `{beautify : true, ascii_only : true, comments : true}`: options to be passed to UglifyJS when converting the AST to a string.

Wrappers, [`String`](http://devdocs.io/javascript/global_objects/string), default to `"$CONTENT$"` (the content is not wrapped): this should be some JS code containing the special `$CONTENT$` keyword which will be replaced by the content of the concerned file. Here are the possible wrappers:

* `inputFileWrapper`: wrapper for each input file.
* `outputFileWrapper`: wrapper for the output file.

## Build process

The parts of the content are queued before being actually written to the output file, allowing for hooking with visitors.

1. for each source file
	1. visitors: `onWriteInputFile`
	1. AST content retrieved
	1. AST content wrapped using `inputFileWrapper`
	1. AST content queued
1. full AST content generated from the queue
1. full AST content wrapped using `outputFileWrapper`
1. visitors: `onWriteJSOutputFile`
1. final content generated
1. final content wrapped with `header` and `footer` (if specified)
1. visitors: `onWriteOutputFile`
1. final content written



# Create an Aria Templates Multi-part file: `ATMultipart`

This builder creates files in the Aria Templates multi-part format. It extends the `Concat` builder, so please refer to it as well.

## Configuration

* `multipartBoundary`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to `'*******************'`: specifies the separator to use between files. This sequence should not appear in any of the files.

## Build process

Note that nothing specific is done by this builder if there is only one source file configured for the package currently being built. Thus, in this case it would behave exactly as the `Concat` builder.

Otherwise, here are the specificities added by this builder:

* after letting the initial `Concat`'s implementation write the provided header, this builder adds the following text: `//***MULTI-PART`
* before letting the initial `Concat`'s implementation write the content of an input file, this builder adds the multi-part header, which has the following format:

```javascript

//{multipartBoundary}
//LOGICAL-PATH:{path}
//{multipartBoundary}
```

where:

* `{multipartBoundary}` is the one provided in configuration
* `{path}` is the logical path of the input file, with backslashes replaced by normal slashes

For the full process, please refer to the `Concat` builder.



# Create custom builders

It is possible to create custom builders and use them in your packages configurations. As an example, you can take a look at the [custom builders created for noderJS](https://github.com/ariatemplates/noder-js/tree/master/build/builders).

## How to declare a custom builder

You simply need to create file `atpackager.js` __at the root of your project__ which looks like this

```javascript
module.exports = function(atpackager) {
    require("./atpackager").init(atpackager);
    atpackager.builders.MyFirstBuilder = require("./myBuilderPath/MyFirstBuilder");
    atpackager.builders.MySecondBuilder = require("./myBuilderPath/MySecondBuilder");
};
```

This is what we call a __plugin__ for atpackager. It is important that you put the plugin file at the root of your project if you want external projects to use the custom builders declared therein.
Plugins allow you also to declare [custom visitors](./visitors.html#create-custom-visitors).


## How to use a custom builder

If you have created a custom builder and declared it in a plugin, you can use it within your project by loading the plugin

```javascript
require('atpackager').loadPlugin('./atpackager');
```

If you want to load atpackager plugins defined in a dependency (for example in [`noderJS`](http://noder-js.ariatemplates.com/)) in order to use the custom builders they declare, you can use

```javascript
require('atpackager').loadNpmPlugin('noder-js');
```

This will load plugin `atpackager.js` at the root of `noder-js` dependency.
