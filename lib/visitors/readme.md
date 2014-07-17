Built-in visitors.



# File system layout

* [`readme.md`](./readme.md): this current documentation file

General purpose specific visitors:

* [`ImportSourceFile.js`](./ImportSourceFile.js): [Import a source file](#import-a-source-file)
* [`ImportSourceFiles.js`](./ImportSourceFiles.js): [Import a set of source files](#import-source-files)
* [`Hash.js`](./Hash.js): [Insert a hash into the output file name](#insert-a-hash-into-the-output-file-name)
* [`CheckPackaged.js`](./CheckPackaged.js): [Check that all files have been packaged](#check-that-all-files-have-been-packaged)
* [`CopyUnpackaged.js`](./CopyUnpackaged.js): [Copy unpackaged files](#copy-unpackaged-files)
* [`TextReplace.js`](./TextReplace.js): [Replace text in files](#replace-text)
* [`Map.js`](./Map.js): [Build a map of input files to output files](#build-a-map-of-input-files-to-output-files)

JavaScript specific visitors:

* [`JSMinify.js`](./JSMinify.js): [Minify JavaScript files](#minify-a-javascript-file)
* [`CheckDependencies.js`](./CheckDependencies.js): [Check/add dependencies](#check-add-dependencies)
* [`CheckGlobals.js`](./CheckGlobals.js): [Check global variables use](#check-global-variables-use)
* [`JSStripBanner.js`](./JSStripBanner.js): [Remove comment banners in JavaScript files](#remove-js-banner)

Aria Templates specific visitors:

* [`ATCompileTemplates.js`](./ATCompileTemplates.js): [Compile Atlas templates](#compile-atlas-templates)
* [`ATDependencies.js`](./ATDependencies.js): [Compute Aria Templates dependencies](#compute-aria-templates-dependencies)
* [`ATRemoveDoc.js`](./ATRemoveDoc.js): [Remove Aria Templates documentation data](#remove-aria-templates-documentation-data)
* [`ATUrlMap.js`](./ATUrlMap.js): [Build an Aria Templates URL Map](#build-an-aria-templates-url-map)
* [`ATNormalizeSkin.js`](./ATNormalizeSkin.js): [Normalize Aria Templates skin](#normalize-aria-templates-skin)



----



# Introduction: what is a visitor?

A visitor is a kind of hook, which implements some specific methods.

Visitors can be instantiated with a custom configuration, and then added to a packaging. Afterwards, the packaging will call the specific methods on all its visitors at different steps of its process.

It implements the concept of _events_:

* events names are equivalent to the implemented methods' names
* adding a visitor is like registering to an event, with implemented methods indicating which events are subscribed
* calling all visitors with a specific method is like emitting the corresponding event





# Some concepts

_Before going further into details, here are a few concepts to know, in order to understand some features, and also to avoid repeating things in the documentation, making it less digestible._

All visitors expect a configuration object as the unique argument of their constructors; they are described in this documentation for each specific visitor. There are several things to say about it, at least __concerning built-in visitors__ (those described here).

First, the configuration object is not altered, its properties are simply used.

Then, most visitors accepts one or more patterns to filter files that they should process. This uses the concept of glob patterns, which are used with the method `isMatch` of `Source File` or `Ouput File` (depending on the actual type of received file), which anyway works the same in both cases.

Visitors processing single files will not do anything with a file that doesn't match the specified pattern. If no pattern was given, the usual default one is chosen so that it takes into account all files (`*/**`), or all files that are relevant (for instance, for visitors processing JavaScript files, the default pattern will filter regarding extensions, keeping `.js` ones).

Therefore, __unless specified otherwise__, the above applies for configuration objects.





# Interface of a visitor

Note: visitor methods don't have significant return value, this doesn't really make sense since the caller doesn't know which visitors are going to be actually called, how many, etc. However, and this is one of the main purposes of visitors, arguments values can be altered (that's why they are mostly shared objects).

Each method corresponds to a specific event during the whole packaging build process. Before describing them, below are a quick overview of the schedules of these events. The first one is the exact which cannot change (built-in the core process of atpackager), whereas the second one considers common practices of visitors. This is because visitors can perform operations with events when reacting to some events, and starting from that, it can be hard to know the actual sequence of events.

Exact schedule:

1. `onInit`
1. `onBeforeBuild`, `onReachingBuildEnd`
	1. `onBeforeOutputFileBuild`
		1. `onWriteInputFile`
		1. `onWriteOutputFile`, `onWriteJSOutputFile`
	1. `onAfterOutputFileBuild`
1. `onAfterBuild`

Variable: `onAddSourceFile`, `onAddOutputFile`, `computeDependencies`.

Common schedule:

1. `onInit`
1. `onAddSourceFile`, `onAddOutputFile`: at the loading of the configuration, and anytime a visitor adds a new file (more likely to be during `onInit` for `onAddSourceFile`, and `onReachingBuildEnd` for `onAddOutputFile`)
1. `onBeforeBuild`, `onReachingBuildEnd`: hooks the build process at whole packaging level. `onReachingBuildEnd` can be called multiple times in between.
	1. `computeDependencies`: called for each output file making the packaging
	1. `onBeforeOutputFileBuild`: hooks the build process at output file level, called for each output file making the packaging
		1. `onWriteInputFile`: called for each input file making the output file
		1. `onWriteOutputFile`, `onWriteJSOutputFile`: called once for the output file
	1. `onAfterOutputFileBuild`
1. `onAfterBuild`



## Methods

Before describing each method specifically, here are their common properties.

All methods receive __as their first parameter an instance of the packaging__ currently processed (there should be only one per invocation of atpackager).

All the other parameters are considered to be required, and to be used both an input and output, the main purpose being to alter those objects.

Everything that is not explicitly stated otherwise applies the above statements.


### On initialization of the packaging

* Name: `onInit`

Called when the packaging is initialized.



### On source file addition

* Name: `onAddSourceFile`

Called when a source file has just been added.

#### Parameters

1. `outputFile`
	* interface: `Source File`
	* The source file added.



### On output file addition

* Name: `onAddOutputFile`

Called when an output file has just been added.

#### Parameters

1. `outputFile`
	* interface: `Output File`
	* The output file added.



### Before the packaging is built

* Name: `onBeforeBuild`

Called right before the packaging is going to be built.



### Before an output file is built

* Name: `onBeforeOutputFileBuild`

Called right before an output file is going to be built.

#### Parameters

1. `outputFile`
	* interface: `Output File`
	* The output file about to be built.



### When computing the dependencies

* Name: `computeDependencies`

Called to compute the dependencies of an input file. It should add the found dependencies to the given packaging.

#### Parameters

1. `inputFile`
	* interface: `Source File`
	* The input file to process.



### Before writing an input file

* Name: `onWriteInputFile`

Called right before an input file is written.

You can use it to alter its content before it is written.

#### Parameters

1. `outputFile`
	* interface: `Output File`
	* The output file (partly) built from the input file.
1. `inputFile`
	* interface: `Source File`
	* The input file about to be written.



### Before writing an output file

* Name: `onWriteOutputFile`

Called right before an output file is written.

You can use it to alter its content before it is written.

#### Parameters

1. `outputFile`
	* interface: `Output File`
	* The output file.
1. `toBeWritten`
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object) with specific properties (see below)
	* An object containing the content to be written.

The `toBeWritten` object contains two properties:

* `content`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* The content to be written.
* `options`
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object)
	* Output options.



### Before writing a JavaScript output file

* Name: `onWriteJSOutputFile`

Called right before a JavaScript file is written.

#### Parameters

1. `outputFile`
	* interface: `Output File`
	* The output file.
1. `toBeWritten`
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object) with specific properties (see below)
	* An object containing the JavaScript content to be written.

The `toBeWritten` object contains two properties:

* `content`
	* interface: UglifyJS AST
	* The AST representing the JavaScript content of the file.
* `options`
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object)
	* Output options.



### After an output file has been built

* Name: `onAfterOutputFileBuild`

Called right after the content of an output file has been built.

#### Parameters

1. `outputFile`
	* interface: `Output File`
	* The output file which has just been built.



### When reaching the end of the build of the packaging

* Name: `onReachingBuildEnd`

Called when the build of the packaging doesn't have anymore output file to build.

It's about to be finished, but this hook is the occasion to add new files to be processed, which would have as effect to postpone the end of the build.



### After the build of the packaging has finished

* Name:  `onAfterBuild`

Called right after the build of the packaging has finished.





----

General purpose specific visitors.

__Unless specified otherwise__, the default value for files filters includes all files: `[**/*]`.

----





# Import a source file

* Name: `ImportSourceFile`

Adds a source file to the packaging, regarding the given configuration.

## Configuration

* `sourceFile`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* The path of the file to import.
* `targetBaseLogicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* The directory path to set for the input file (purely logical, not the actual one on the storage device).

## Implemented methods

### `onInit`

The given `sourceFile` path is resolved using standard Node.js module `path`'s [`resolve`](http://devdocs.io/node/path#path_path_resolve_from_to) method.

Then, a new `Source File` instance is created with given `targetBaseLogicalPath` as `logicalPath`, and added to the packaging.

The previous resolved path is used only for being able to actually load the content of the file: the built-in content provider `fileLoader` is set as the file's content provider and the latter's load path is set to the resolved path.





# Import source files

* Name: `ImportSourceFiles`

Adds source files to the packaging, regarding the given configuration.

## Configuration

* `sourceDirectory`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `""` (empty)
	* The directory from which to import the files.
* `sourceFiles`
	* interface: as expected by the method [`grunt.file.expand`](http://gruntjs.com/api/grunt.file#grunt.file.expand)'s `patterns` parameter
	* default: `['**/*']`
	* A set of patterns to filter the files to be imported.
* `targetBaseLogicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `""` (empty)
	* The directory path to set for the input files (purely logical, not the actual one on the storage device).

## Implemented methods

### `onInit`

File are imported from the given `sourceDirectory` and filtered with the given `patterns`, using [`grunt.file.expand`](http://gruntjs.com/api/grunt.file#grunt.file.expand).

Then, for each found file, a new `Source File` instance is created, with `targetBaseLogicalPath` as `logicalPath`, and added to the packaging. In order to remain able to load the content of the file, the built-in content provider `fileLoader` is set as their content provider, and their load path is configured through it.





# Insert a hash into the output file name

* Name: `Hash`

Inserts a hash into an output file's name, regarding the given pattern. The hash is computed with given options from the output file's content.

## Configuration

### Files filtering

* `files`

### Hash configuration

* `hash`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string) or as expected by Node.js module [`crypto`](http://devdocs.io/node/crypto)
	* default: `"md5"`
	* The hash method to use (see below for more information about the possible ones).
* `pattern`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `"[name]-[hash][extension]"`
	* The new output file pattern (see below for more information about its format).

#### The hash methods

The standard Node.js module [`crypto`](http://devdocs.io/node/crypto) is used to compute the hash, therefore the value of the property `hash` can be anything that it accepts.

However, an additional hash method is supported: `"murmur3"`. For that, it uses the npm package [`murmurhash-js`](https://github.com/garycourt/murmurhash-js).

#### The pattern format

The pattern defines the new basename of the file (which means, its whole folder path apart).

In order to build the new one, you have three variables available:

* `name`: the basename of the file without its extension
* `hash`: the value of the computed hash (this one should be used, this is the purpose of the visitor)
* `extension`: the extension of the file, dot included

In the pattern string, you can use those variables by surrounding them with brackets. There is nothing more specific when processing the pattern, no escaping, etc. Also, if you put an unsupported variable name between brackets, it won't be processed, the corresponding string including its brackets will be taken as is.

## Implemented methods

### `onAfterOutputFileBuild`

Replaces the basename of the given output file, following the given or default pattern, normally including the hash value.

See above for a main description about the hash method and the pattern processing. Below are given more details.

The hash is computed either by the standard [`crypto`](http://devdocs.io/node/crypto) module of Node.js or by [`murmurhash-js`](https://github.com/garycourt/murmurhash-js).

In the first case, the method [`createHash`](http://devdocs.io/node/crypto#crypto_crypto_createhash_algorithm) is used, and the value of the configuration property `hash` is passed as is.

The second case occurs if the value of this property resolves to `"murmur3"`, __and has precedence__ (so if ever one day this is supported by Node.js, the npm package will still take care of it). In this case, the method `murmur3` is used.

In both cases, the content of the file is given as is to compute the hash. This content is read using the utility [`grunt .file.read`](http://gruntjs.com/api/grunt.file#grunt.file.read), with an `encoding` set to [`null`](http://devdocs.io/javascript/global_objects/null): raw data is used, to be sure to have unique hashes regarding the actual content (binary) of the file.





# Check that all files have been packaged

* Name: `CheckPackaged`

Checks that no file present as source file of the packaging was left unprocessed.

## Configuration

### Files filtering

* `files`

## Implemented methods

### `onAfterBuild`

Will log an error with grunt ([`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error)) for each source file contained in the packaging, and which has no associated output file: that means it wasn't used at all even though it was configured to be part of the packaging.





# Copy unpackaged files

* Name: `CopyUnpackaged`

Copy files present in the packaging but not used to build any output file.

## Configuration

### Files filtering

* `files`

### Copy configuration

* `builder`
	* interface: a builder configuration
	* default: `{type: 'Copy'}` (the builder `Copy` without specific configuration)
	* The builder configuration used to retrieve a builder to use to copy the files.
* `renameFunction`
	* interface: [`Function`](http://devdocs.io/javascript/global_objects/function)
	* default: the identity function (it returns its first given argument, as is)
	* A function used to rename the copied file.

## Implemented methods

### `onReachingBuildEnd`

Will copy all the source files that the packaging contains, which were not used already to build other files.

The file content is copied using the builder retrieved/created from the given `builder` configuration.

What the visitor does however is only to create new `Output File` instances, add them to the packaging, and configure each with the above mentioned builder. The name of the output files are taken from the names of the input files, possibly renamed using the given `renameFunction`.





# Replace text

* Name: `TextReplace`

Modifies the content of the given input file by applying the given replacements.

## Configuration

### Files filtering

* `files`

### Replacement configuration

* `replacements`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of [`Object`](http://devdocs.io/javascript/global_objects/object) (see below for details about the replacement object)
	* default: `[]` (no replacement)
	* A list of replacements to be done.

The replacement object:

* `find`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* The pattern to find in the text and replace.
* `replace`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* The replacement text.

## Implemented methods

### `onWriteInputFile`

Text content is get and set using respectively `getTextContent` and `setTextContent` on the input file.

Replacements are done using the native [`replace`](http://devdocs.io/javascript/global_objects/string/replace) method of [`String`](http://devdocs.io/javascript/global_objects/string), passing `find` as first arguments and `replace` as second.





# Build a map of input files to output files

* Name: `Map`

Creates a map of input/output files and writes it on the disk.

The keys of the map are paths to input files of the packaging, while values are paths to their associated output file.

## Configuration

### Files filtering

* `sourceFiles`: source files to take into account in the map.
* `outputFiles`: output files to take into account in the map.

### Map file configuration

* `mapFile`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `'map.js'`
	* The output name of the map file.
* `mapFileEncoding`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`null`](http://devdocs.io/javascript/global_objects/null) (uses [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding) instead)
	* The encoding of the map file.
* `outputDirectory`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`null`](http://devdocs.io/javascript/global_objects/null) (uses the packaging's directory instead)
	* The output directory of the map file.

## Implemented methods

### `onAfterBuild`

A source file is not necessarily included in the map, it needs to satisfy the following conditions:

* is is associated to an `outputFile`
* its path matches given `sourceFiles` pattern
* its associated `outputFile`'s path matches given `outputFiles` pattern

If the file is actually included, it is then added to the map. The paths used to make to key/value pair are normalized

The normalization of the paths ensures that the separator used is the slash (`/`) character. It uses [`path.normalize`](http://devdocs.io/node/path#path_path_normalize_p) behind.

Finally, it serializes the built map using standard [`JSON.stringify`](http://devdocs.io/javascript/global_objects/json/stringify) method without any further argument.

The resulting string is output to a file whose path is built from the joining of the `outputDirectory` and the `mapFile` file name.




----

JavaScript specific visitors.

__Unless specified otherwise__, the default value for files filters includes all JavaScript files: `[**/*.js]`.

----





# Minify a JavaScript file

* Name: `JSMinify`

## Configuration

### Files filtering

* `files`: global filter
* `outputFiles`: output files to take into account
* `inputFiles`: input files to take into account

### Minification configuration

* `skipJSConcatParts`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* If truthy, will not process input files part of an output file built with the built-in builder `JSConcat`. Useful since this doesn't make much sense to minify each single part, but rather the resulting output file as whole.
* `compress`
	* interface: if the value `false` is not given, as expected by `UglifyJS.Compressor`
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined), and if value is different from `false` but still falsy, an empty object `{}`
	* The UglifyJS compressor configuration, used to compress the AST.
* `mangle`
	* interface: if the value `false` is not given, as expected by UglifyJS AST method `mangle_names`
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined), and if value is different from `false` but still falsy, an empty object `{}`
	* The name mangling configuration.
* `output`
	* interface: as expected by the second argument of the `uglifyHelpers`'s `astToString` helper
	* default (if value is falsy): `{ascii_only: true}`
	* The output options to be used for the AST.

## Implemented methods

### `onWriteInputFile`

Will minify the input file AST if:

* it matches the `files` filter
* it matches the `inputFiles` filter
* in case `skipJSConcatParts` is truthy: it is not part of an output file whose builder is an instance of the built-in builder `JSConcat`

It retrieves the AST content using the built-in `uglifyJSContentProvider` content provider, and if there is one compresses it. See below section for more information.

It will set the new AST using the same content provider, and forwarding the given `output` configuration.

Finally, the content provider of the file will be set to the one used during this whole process, to be sure the proper content will be retrieved later on.

### `onWriteJSOutputFile`

Compresses the given AST in forwarded content wrapper object, and sets the latter's output `options` using the one passed in configuration (under `output` property).

See below section for more information.

## AST compression

To compress the AST, two things are used:

* the compressor
* the names mangling

Both are used only if a corresponding configuration object has been created (please refer to the visitor configuration documentation for more details).

If the `compressor` configuration is not `false`, its computed value is forwarded to the constructor `UglifyJS.Compressor` to build a new compressor object, and then used to compress the AST.

If the `mangle` configuration is not `false`, its computed value is forwarded to the method `mangle_names` of the AST object in order to mangle the names.





# Check/Add dependencies

* Name: `CheckDependencies`

Checks/adds the dependencies of all the source files of an output file. __This is necessary to have dependencies actually fetched__ (by the use of visitors implementing `computeDependencies`).

## Configuration

### Files filtering

* `files`

### Dependencies check

* `noCircularDependencies`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* Whether to allow [circular dependencies](https://en.wikipedia.org/wiki/Circular_dependency) or not.
* `addUnpackagedDependencies`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* Whether to add missing dependencies or not.
* `unpackagedDependenciesError`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* If unpackaged dependencies are not added (`addUnpackagedDependencies` is falsy), whether to log an error with grunt in case of unpackaged dependencies or not.

### Ordering

* `checkPackagesOrder`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* Whether dependencies should be forced to be included by the output file or one that has been built before - in other words to avoid it to be packaged __after__  - or not. Indeed, in some cases some will be included after, as dependencies of other output files.
* `reorderFiles`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* Controls the order of source files contained by the output file: whether to keep the order in which source files have been encountered while processing dependencies, or to let the latter at the end of the list, as they were appended.

## Implemented methods

### `onBeforeOutputFileBuild`

For each source file making this output file, the dependencies are processed. See section below to know about the dependencies processing of a single file.

Once all dependencies have been processed, likely adding source files to the output file, the work is over. However, is `reorderFiles` is truthy, the list of source files is put in the order in which dependencies have been encountered during the whole process.

#### Single dependency processing

The dependencies processing is recursive, which means that as long as a file has dependencies, its dependencies will be looked for other dependencies.

During this lookup, circular dependencies are checked: any file that depends on a file which has already been processed is considered to have a circular dependency on the latter. If `noCircularDependencies` is truthy, anytime a circular dependency is found an error is logged using [`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error) specifying the list of concerned dependencies, and the current dependency processing is stopped.

Already processed files are skipped to avoid useless computations.

If a currently processed dependency is already associated to __another__ package __which has not yet been built__ and `checkPackagesOrder` is truthy, an error message will be logged using [`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error) to tell that a dependency file will be packaged after, and the current dependency processing is stopped.

If the currently processed dependency is not part of any package yet but `addUnpackagedDependencies` is falsy, the current dependency processing is stopped. Additionally, if `unpackagedDependenciesError` is truthy, and error is logged using [`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error) specifying the unpackaged dependency.

Finally, if everything went fine, the dependency is added to the package if it wasn't part of any other.





# Check global variables use

* Name: `CheckGlobals`

Checks global variables use.

## Configuration

### Files filtering

* `files`

### Globals configuration

* `strict`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined), which resolves to `true` in this case
	* Whether to use strict checking or not (the value is strictly compared to `false` to get a boolean). In strict mode, a global must be explicitly allowed to be considered as accepted, while otherwise it must only not be forbidden.

Globals permissions:

1. `allowStdJSGlobals`
	* interface: value `false` or anything else
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined) (truthy in this context)
	* Whether to allow standard JavaScript globals or not (see below for a list).
1. `allowCommonJSGlobals`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: falsy
	* Whether to allow global defined by [CommonJS](http://wiki.commonjs.org/wiki/CommonJS) or not (see below for a list).
1. `allowedGlobals`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* If specified, the globals listed here are set as being allowed.
1. `forbiddenGlobals`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* If specified, the globals listed here are set as being forbidden.

The list above is ordered, since all these properties are processed in this order, with any of the possible override. So for instance listed forbidden globals have precedence over allowed one.

Here are the lists of globals per category:

* Standard (`allowStdJSGlobals`):
	* [`Math`](http://devdocs.io/javascript/global_objects/math)
	* [`RegExp`](http://devdocs.io/javascript/global_objects/regexp)
	* [`Array`](http://devdocs.io/javascript/global_objects/array)
	* [`Date`](http://devdocs.io/javascript/global_objects/date)
	* [`Number`](http://devdocs.io/javascript/global_objects/number)
	* [`Function`](http://devdocs.io/javascript/global_objects/function)
	* [`String`](http://devdocs.io/javascript/global_objects/string)
	* [`Error`](http://devdocs.io/javascript/global_objects/error)
	* [`Object`](http://devdocs.io/javascript/global_objects/object)
	* [`parseInt`](http://devdocs.io/javascript/global_objects/parseint)
	* [`parseFloat`](http://devdocs.io/javascript/global_objects/parsefloat)
	* [`isNaN`](http://devdocs.io/javascript/global_objects/isnan)
	* [`isFinite`](http://devdocs.io/javascript/global_objects/isfinite)
	* [`encodeURIComponent`](http://devdocs.io/javascript/global_objects/encodeuricomponent)
	* [`decodeURIComponent`](http://devdocs.io/javascript/global_objects/decodeuricomponent)
	* [`encodeURI`](http://devdocs.io/javascript/global_objects/encodeuri)
	* [`decodeURI`](http://devdocs.io/javascript/global_objects/decodeuri)
	* `escape`
	* `unescape`
	* [`eval`](http://devdocs.io/javascript/global_objects/eval)
	* [`NaN`](http://devdocs.io/javascript/global_objects/nan)
	* [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* [`Infinity`](http://devdocs.io/javascript/global_objects/infinity)
* [CommonJS](http://wiki.commonjs.org/wiki/CommonJS) (`allowCommonJSGlobals`):
	* `module`
	* `exports`
	* `require`
	* `__filename`
	* `__dirname`

## Implemented methods

### `onWriteInputFile`

Everytime a forbidden global is used in one of those files, an error will be logged using grunt ([`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error)), specifying which global was used and in which file.





# Remove JS Banner

* Name: `JSStripBanner`

Removes from the content of the file what is considered as a banner; content is considered itself as JavaScript source code.

## Configuration

### Files filtering

* `files`

### Banners types

* `line`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: falsy
	* Whether single line comments should be removed as well.
* `block`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: falsy
	* Whether all block comments should be removed unconditionally, or block comments with a specific syntax should be preserved.

## Implemented methods

### `onWriteInputFile`

A banner is a piece of comment put on top of the file, before any actual source code.

Here are the kind of comments removed, depending on the given configuration:

* `line` is truthy: `// ...` leading comments are removed
* `block` is truthy: `/* ... */` leading comments are removed
* `block` is falsy: `/* ... */` leading comments are removed, except those with an extra exclamation mark, like this: `/*! ... */`

You can see that anyway one type of block comments will be removed.





----

Aria Templates specific visitors.

__Unless specified otherwise__, the default value for files filters includes all files: `[**/*]`. In some cases some are specified with a filter to include JavaScript files. Indeed, Aria Templates is made of both JavaScript files and Template files, and the latter can even get compiled to JavaScript files too.

----





# Compile Atlas templates

* Name: `ATCompileTemplates`

Compiles Atlas templates.

## Configuration

### Files filtering

* `files`

## Implemented methods

### `onWriteInputFile`

In addition to the given `files` filter, if the file does not correspond to an actual template (we determine it if we can't find an associated parser), the file won't be processed.

It uses the content provider `ATCompiledTemplate` to compile the template and store the associated content, and also sets it as the default content provider of the file, so that this is the content that would be fetched.





# Compute Aria Templates dependencies

* Name: `ATDependencies`

Computes the dependencies of the given input file, and adds them to the latter.

## Configuration

### Files filtering

* `files`

### Options

* `mustExist`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* Whether to be strict or not when finding dependencies: if truthy, determined dependencies must be found in the packaging.
* `externalDependencies`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `[]`
	* List of paths of dependencies to consider as external, and therefore which do not have to be inside the packaging.

## Implemented methods

### `computeDependencies`

Dependencies of the given input file are computed, and then actually specified as being dependencies of the file.

Note that dependencies must be part of the packaging already, either already added to it or present in its source directory.

If a dependency could not be found, is not part of the specified `externalDependencies` and if `mustExist` is truthy, an error is logged then.





# Remove Aria Templates documentation data

* Name: `ATRemoveDoc`

Removes chose documentation data, with impact on runtime and/or package's size.

## Configuration

### Files filtering

* `files`
	* default: `['**/*.js']` (all JavaScript files)

### Elements to remove

* `removeBeanDescription`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* Remove the description of properties in Bean definitions
* `removeEventDescription`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* Remove the description of events in Aria object definitions
* `removeErrorStrings`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `false`
	* Remove the error strings. __See description for details__.
* `replaceStaticsInErrors`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `false`
	*  __See description for details__.

## Implemented methods

### `onWriteInputFile`

Removes the selected documentation content from the given input file.

If something actually changed (something was removed), the content provider of the file is set to `uglifyContentProvider`.

To remove the content, it uses the utility [`ATRemoveDoc`](../ATRemoveDoc.js). However, here is a description below.

Errors strings are removed from:

* `$statics`
* in function calls:
	* `$logError`
	* `$logWarn`
	* `$logInfo`
	* `_logError`





# Build an Aria Templates URL Map

* Name: `ATUrlMap`

Builds a [URL map](http://ariatemplates.com/usermanual/latest/url_handling), and exports it into an executable piece of JavaScript code, directly using the [`aria.core.DownloadMgr.updateUrlMap`](http://ariatemplates.com/aria/guide/apps/apidocs/#aria.core.DownloadMgr:updateUrlMap:method) method with this map.

## Configuration

### Files filtering

* `sourceFiles`: source files to take into account in the map
* `outputFiles`: output files to take into account in the map
* `onlyATMultipart`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* If `true`, only takes into account output files built with the `ATMultipart` builder.

### Map file specifications

Output:

* `mapFile`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `"map.js"`
	* Name of the file into which the map should be output.
* `mapFileEncoding`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`null`](http://devdocs.io/javascript/global_objects/null) (uses [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding) instead)
	* The encoding of the file to which the map is output.
* `outputDirectory`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: [`null`](http://devdocs.io/javascript/global_objects/null) (uses the packaging's directory instead)
	* The directory of the map file.
* `append`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* If `true`, appends to the resolved map file if it exists, otherwise always creates a new one.

Compression:

* `starCompress`
	* interface: _glob pattern_
	* default: `["**/*"]` (all files)
	* Filters for files accepting to be star compressed (see full description for more about this concept).
* `starStarCompress`
	* interface: _glob pattern_
	* default: `["**/*"]` (all files)
	* Filters for files accepting to be star-star compressed (see full description for more about this concept).
* `minifyJS`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: `true`
	* If `true`, the generated code will be minified using `UglifyJS.minify` and the given/processed `minifyJSOptions`. Moreover.
* `minifyJSOptions`
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object) with specific properties (see below)
	* default: `{}`
	* The processed options will always have at least the following properties: `{fromString: true}`.
* `jsonIndent`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: _4 spaces_
	* The indentation string to use when serializing the map using [`JSON.stringify`](http://devdocs.io/javascript/global_objects/json/stringify). It is not relevant (unused) when `minifyJS` is `true`.


## Implemented methods

### `onAfterBuild`

For quick recap, an Aria Templates URL map maps classpaths to the actual file in which it is stored. Indeed, it allows to override the default behavior where one classpath corresponds exactly to one file path.

Example of such a map:

```json
{
	"A": {
		"B": {
			"X": "XY.js",
			"Y": "XY.js",
			"Z": "Z.js"
		}
	}
}
```

(note that the output files names are always normalized and forced to use forward slashes).

Now, here is the process.

The source files contained in the packaging are iterated over.

A given source file is added to the map only if it matches the following criteria:

1. it has an associated output file
1. `onlyATMultipart` is `false` or the file is used by the `ATMultipart` builder to build its associated output file
1. it matches the given `sourceFiles` pattern
1. its associated output file matches the given `outputFiles` pattern
1. its associated output file's path is not equal to the given `mapFile` path (normalized)

Once the map is built, if the given option `starCompress` is truthy, the star compression is applied, and afterwards star-star compression is applied if `starStarCompress` is truthy. See sections below for more information about these concepts.

Then, the map is serialized, and the piece of code is generated, generating a call to `aria.core.DownloadMgr.updateUrlMap` giving the previously serialized map as unique argument.

If `JSMinify` is truthy, the resulting piece of code is minified using `UglifyJS.minify`.

Then, the piece of code is output to the file corresponding to the joining of the `outputDirectory` path and the `mapFile`. If the file already exists, it is overwritten if `append` is falsy, otherwise the code is appended. If the file doesn't exist yet, it is created with the piece of code as content. Note that `mapFileEncoding` is used anyway, whether the file existed or not.

#### Star compression

The goal of the map is to find the output file corresponding to a given classpath.

If we take the example above, we can see that `A.B.Z` will resolve to `Z.js`, but both `A.B.X` and `A.B.Y` will resolve to `XY.js`.

The star compression takes in a given module a group of classes mapped to the same output file, and removes all those mappings to replace them with a single generic one named `*`. This becomes a fallback when the class is not explicitly mapped.

With our previous example, this would give:

```json
{
	"A": {
		"B": {
			"*": "XY.js",
			"Z": "Z.js"
		}
	}
}
```

For best efficiency, the highest numbers of mappings will be removed, which means the star fallback will map to the output file with the highest number of classes.

__Note that to avoid a base classpath to be compressed - which means to receive a _star_ fallback - you can use the filter `starCompress`.__

#### Star-star compression

The goal of star-star compression is the same: to gain some spaces in the map be grouping some entries.

The difference here is that it spans across several hierarchy of modules. Given another example:

```json
{
	"A": {
		"B": {
			"*": "P.js"
		}
	}
}
```

this would give:

```json
{
	"**": "P.js"
}
```

__Note that to avoid a base classpath to be compressed - which means to receive a _star-star_ fallback - you can use the filter `starStarCompress`.__





# Normalize Aria Templates skin

* Name: `ATNormalizeSkin`

Normalizes Aria Templates skin definitions.

## Configuration

### Files filtering

* `files`
	* default: `['**/*.js']` (all JavaScript files)

### Normalization options

* `jsonIndent`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: _4 spaces_
	* The indentation string to use.
* `strict`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: falsy
	* Whether to log actual error messages if there are errors, or to simply log warnings.

## Implemented methods

### `onWriteInputFile`

First note that in addition to the given `files` filter, files who don't define an Aria class with a classpath corresponding to the skin ([`aria.widgets.AriaSkin`](http://ariatemplates.com/aria/guide/apps/apidocs/#aria.widgets.AriaSkin)) will be skipped as well.

Then, it normalizes the skin definition using [`aria.widgets.AriaSkinNormalization.normalizeSkin`](http://ariatemplates.com/aria/guide/apps/apidocs/#aria.widgets.AriaSkinNormalization:normalizeSkin:method), replacing the content of the file if done with success, logging an error otherwise.
