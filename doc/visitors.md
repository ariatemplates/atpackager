A visitor is a kind of hook, which implements some specific methods.

Visitors can be instantiated with a custom configuration, and then added to a packaging. The packager will call the specific methods on all its visitors at different steps of its process.

It implements the concept of _events_:

* events names are equivalent to the implemented methods' names
* adding a visitor is like registering to a set of events, with implemented methods indicating the events the visitor wants to subscribe to
* calling all visitors with a specific method is like emitting the corresponding event

All visitors can potentially expect a configuration object.

__Important__:

Most visitors accepts one or more patterns to filter files that they should process. This uses the concept of [glob patterns](http://gruntjs.com/api/grunt.file#globbing-patterns).

Visitors processing single files will not do anything with a file that doesn't match the specified pattern. If no pattern was given, the usual default one is chosen so that it takes into account all files (`**/*`), or all files that are relevant (for instance, for visitors processing JavaScript files, the default pattern will filter in only files with a `.js` extension).

__Unless specified otherwise__, the above applies to any visitor configuration.

There are [built-in visitors](#built-in-visitors), but you can also [create custom ones or use custom visitors from other libraries](#create-custom-visitors).



# Events/visitors' methods

Each method corresponds to a specific event during the whole packaging process.

Common schedule:

1. `onInit` (when the packaging is initialized)
1. `onAddSourceFile` (when a source file has just been added), `onAddOutputFile` (when an output file has just been added): when loading the configuration, and anytime a new file is added. Visitors can indirectly trigger it at anytime, however it is more likely to happen during `onInit` for `onAddSourceFile`, and `onReachingBuildEnd` for `onAddOutputFile`.
1. `onBeforeBuild` (right before the packaging is going to be built), `onReachingBuildEnd` (when the build of the packaging doesn't have anymore output file to build): `onReachingBuildEnd` can be called multiple times in between, if the reacting visitors add additional output files to be built. The following nested level is applied for each output file making the packaging.
	1. `computeDependencies`: called to compute the dependencies of an input file (unlike other methods, this one has to be explicitly called, as done, for example, by the [`CheckDependencies` visitor](check-add-dependencies-checkdependencies-))
	1. `onBeforeOutputFileBuild` (right before an output file is going to be built): the following nested level is applied for each input file making the packaging.
		1. `onWriteInputFile` (right before an input file is written):
	1. `onWriteOutputFile` (right before an output file is written), `onWriteJSOutputFile` (right before a JavaScript file is written)
	1. `onAfterOutputFileBuild` (right after the content of an output file has been built)
1. `onAfterBuild` (right after the build of the packaging has finished)



# Built-in visitors

General purpose (unless specified otherwise, input files filter's default value is `[**/*]`):

* [Import a source file](#import-a-source-file-importsourcefile-)
* [Import a set of source files](#import-source-files-importsourcefiles-)
* [Insert a hash into the output file name](#insert-a-hash-into-the-output-file-name-hash-)
* [Check that all files have been packaged](#check-that-all-files-have-been-packaged-checkpackaged-)
* [Copy unpackaged files](#copy-unpackaged-files-copyunpackaged-)
* [Replace text in files](#replace-text-textreplace-)
* [Build a map of input files to output files](#build-a-map-of-input-files-to-output-files-map-)

JavaScript (unless specified otherwise, input files filter's default value is `[**/*.js]`):

* [Minify JavaScript files](#minify-a-javascript-file-jsminify-)
* [Check/add dependencies](#check-add-dependencies-checkdependencies-)
* [Check global variables use](#check-global-variables-use-checkglobals-)
* [Remove comment banners in JavaScript files](#remove-js-banner-jsstripbanner-)

Aria Templates (unless specified otherwise, input files filter's default value is `[**/*]`):

* [Compile Atlas templates](#compile-atlas-templates-atcompiletemplates-)
* [Compute Aria Templates dependencies](#compute-aria-templates-dependencies-atdependencies-)
* [Remove Aria Templates documentation data](#remove-aria-templates-documentation-data-atremovedoc-)
* [Build an Aria Templates URL Map](#build-an-aria-templates-url-map-aturlmap-)
* [Normalize Aria Templates skin](#normalize-aria-templates-skin-atnormalizeskin-)



# Import a source file: `ImportSourceFile`

Adds a source file to the packaging, according to the given configuration.

__When__: `onInit`

## Configuration

* `sourceFile`, [`String`](http://devdocs.io/javascript/global_objects/string), __required__: the path of the file to import.
* `targetBaseLogicalPath`, [`String`](http://devdocs.io/javascript/global_objects/string), __required__: the directory path to set for the input file (purely logical, not the actual one on the storage device).

## Description

A new source file is added to the packaging. Its relative path inside this packaging will be the one specified in `targetBaseLogicalPath`, while the actual path of the file - used to read its content - will be the given path `sourceFile`, resolved by passing this value to Node.js [`path.resolve`](http://devdocs.io/node/path#path_path_resolve_from_to) method.



# Import source files: `ImportSourceFiles`

Adds source files to the packaging, regarding the given configuration.

__When__: `onInit`

## Configuration

* `sourceDirectory`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to `""` (empty): the directory from which to import the files.
* `sourceFiles`, defaults to `['**/*']`: a set of patterns to filter the files to be imported. Passed to the method [`grunt.file.expand`](http://gruntjs.com/api/grunt.file#grunt.file.expand) as `patterns`.
* `targetBaseLogicalPath`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to `""` (empty): the directory path to set for the input files (purely logical, not the actual one on the storage device).

## Description

Files are imported from the given `sourceDirectory` and filtered with the given patterns, using [`grunt.file.expand`](http://gruntjs.com/api/grunt.file#grunt.file.expand).

The rest is very similar to the visitor `ImportSourceFile`: `targetBaseLogicalPath` is used as the logical path for the imported files inside the packaging, while it can be different from the actual `sourceDirectory` which is used solely to retrieve the content of the files when needed.



# Insert a hash into the output file name: `Hash`

Inserts a hash into an output file's name, according to the given pattern. The hash is computed with given options from the output file's content.

__When__: `onAfterOutputFileBuild`

## Configuration

* `files`: files filtering property

Hash configuration:

* `hash`, [`String`](http://devdocs.io/javascript/global_objects/string) or as expected by Node.js module [`crypto`](http://devdocs.io/node/crypto), defaults to `"md5"`: the hash method to use (see below for more information about the possible ones).
* `pattern`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to `"[name]-[hash][extension]"`: the new output file pattern (see below for more information about its format).

#### The hash methods

The standard Node.js module [`crypto`](http://devdocs.io/node/crypto) is used to compute the hash, therefore the value of the property `hash` can be anything that it accepts.

However, an additional hash method is supported: `"murmur3"`. For that, it uses the npm package [`murmurhash-js`](https://github.com/garycourt/murmurhash-js).

#### The pattern format

The pattern defines the new basename of the file (no impact on the folder path).

In order to build the new one, you have three variables available:

* `name`: the basename of the file without its extension
* `hash`: the value of the computed hash (this one should be used, this is the purpose of the visitor)
* `extension`: the extension of the file, dot included

In the pattern string, you can use those variables by surrounding them with brackets. There is nothing more specific when processing the pattern, no escaping, etc. Also, if you put an unsupported variable name between brackets, it won't be processed, the corresponding string including its brackets will be taken as is.

## Description

Replaces the basename of the given output file, following the given or default pattern, normally including the hash value.

The hash is computed either by the standard [`crypto`](http://devdocs.io/node/crypto) module of Node.js or by [`murmurhash-js`](https://www.npmjs.org/package/murmurhash-js).

In the first case, the method [`createHash`](http://devdocs.io/node/crypto#crypto_crypto_createhash_algorithm) is used, and the value of the configuration property `hash` is passed as is.

The second case occurs if the value of this property resolves to `"murmur3"`. In this case, the method `murmur3` is used.

<!--
	If one day it becomes possible to pass extra arguments, it is better to use this line instead of the previous one to explain the behaviour:
	The second case occurs if the value of this property resolves to `"murmur3"`, __and has precedence__ (so if ever one day this is supported by Node.js, the npm package will still take care of it). In this case, the method `murmur3` is used.
-->


In both cases, the content of the file is given as is to compute the hash. This content is read using the utility [`grunt.file.read`](http://gruntjs.com/api/grunt.file#grunt.file.read), with an `encoding` set to [`null`](http://devdocs.io/javascript/global_objects/null): raw data is used, to be sure to have unique hashes regarding the actual content (binary) of the file.



# Check that all files have been packaged: `CheckPackaged`

Checks that no file present as source file of the packaging was left unprocessed.

__When__: `onAfterBuild`

## Configuration

* `files`: files filtering property

## Description

Will log an error with grunt ([`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error)) for each source file contained in the packaging, and which has no associated output file: that means it wasn't used at all even though it was configured to be part of the packaging.



# Copy unpackaged files: `CopyUnpackaged`

Copy files present in the packaging but not used to build any output file.

__When__: `onReachingBuildEnd`

## Configuration

* `files`: files filtering property

Copy configuration:

* `builder`, expects a builder configuration object, defaults to `{type: 'Copy'}`: the builder configuration to use in order to copy the files.
* `renameFunction`, [`Function`](http://devdocs.io/javascript/global_objects/function), defaults to the identity function (it returns its first given argument, as is): a function used to rename the copied file.

## Description

Will copy all the source files that the packaging contains, which were not used already to build other files.

The file content is copied using the builder retrieved/created from the given `builder` configuration.

What the visitor does however is only to create new output file instances, add them to the packaging, and configure each with the above mentioned builder. The name of the output files are taken from the names of the input files, possibly renamed using the given `renameFunction`.



# Replace text: `TextReplace`

Modifies the content of the given input files by applying the given replacements.

__When__: `onWriteInputFile`

## Configuration

* `files`: files filtering property

Replacement configuration:

* `replacements`, [`Array`](http://devdocs.io/javascript/global_objects/array) of [`Object`](http://devdocs.io/javascript/global_objects/object) (see below for details about the replacement object), defaults to `[]` (no replacement): a list of replacements to be done.

The replacement object:

* `find`, [`String`](http://devdocs.io/javascript/global_objects/string) or [`RegExp`](http://devdocs.io/javascript/global_objects/regexp), __required__: the pattern to find in the text and replace.
* `replace`, [`String`](http://devdocs.io/javascript/global_objects/string), __required__: the replacement text.

## Description

Replacements are done using the native [`replace`](http://devdocs.io/javascript/global_objects/string/replace) method of [`String`](http://devdocs.io/javascript/global_objects/string), passing `find` as first argument and `replace` as second.



# Build a map of input files to output files: `Map`

Creates a map of input/output files and writes it on the disk.

The keys of the map are paths to input files of the packaging, while values are paths to their associated output file.

__When__: `onAfterBuild`

## Configuration

Files filtering:

* `sourceFiles`: source files to take into account in the map.
* `outputFiles`: output files to take into account in the map.

Map file configuration:

* `mapFile`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to `'map.js'`: the output name of the map file.
* `mapFileEncoding`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to [`null`](http://devdocs.io/javascript/global_objects/null) (uses [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding) instead): the encoding of the map file.
* `outputDirectory`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to [`null`](http://devdocs.io/javascript/global_objects/null) (uses the packaging's directory instead): the output directory of the map file.

## Description

A source file is not necessarily included in the map, it needs to satisfy the following conditions:

* it is associated to an output file
* its path matches the given `sourceFiles` pattern
* its associated output file's path matches the given `outputFiles` pattern

If the file is actually included, it is then added to the map. The paths used to make the key/value pairs are normalized, which ensures that the separator used is the slash (`/`) character. It uses [`path.normalize`](http://devdocs.io/node/path#path_path_normalize_p) behind.

Finally, it serializes the built map using standard [`JSON.stringify`](http://devdocs.io/javascript/global_objects/json/stringify) method without any further argument.

The resulting string is output to a file whose path is built from the joining of the `outputDirectory` and the `mapFile` file name.



# Minify a JavaScript file: `JSMinify`

__When__: `onWriteInputFile`, `onWriteJSOutputFile`

## Configuration

Files filtering:

* `files`: global filter
* `outputFiles`: output files to take into account
* `inputFiles`: input files to take into account

Minification configuration:

* `skipJSConcatParts`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: if `true`, will not process input files part of an output file built with the built-in builder `JSConcat`. Useful since it doesn't make much sense to minify each single part, but rather the resulting output file as a whole.
* `compress`, `false` or as expected by `UglifyJS.Compressor`: the UglifyJS compressor configuration, used to compress the AST. If set to `false`, no compression will be done, otherwise an instance of the `UglifyJS.Compressor` will be created with the provided value (which is set to `{}` if the value is falsy).
* `mangle`, `false` or as expected by UglifyJS AST method `mangle_names`: the name mangling configuration. If set to `false`, no mangling will be done, otherwise the mangling method will be created with the provided value (which is set to `{}` if the value is falsy).
* `output`, [`Object`](http://devdocs.io/javascript/global_objects/object) (see below), defaults to `{ascii_only: true}` if value evaluates to `false`: the output options to customize the generation of a string from the AST.

`output` properties:

* `comments`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `false`: if `true`, removes the following properties (if they exist) from every node of the AST, before the serialization: `node.start._comments_dumped`, `node.end._comments_dumped`

## Description

### `onWriteInputFile`

Will minify the input file AST if:

* it matches the `files` filter
* it matches the `inputFiles` filter
* in case `skipJSConcatParts` is `true`: it is not part of an output file whose builder is an instance of the built-in builder `JSConcat`

It tries to retrieve the AST content of the file and if there is one compresses it. See below section for more information.

It will set the new AST along with the given `output` configuration.

### `onWriteJSOutputFile`

Compresses the given AST in forwarded content wrapper object, and sets the latter's output `options` using the one passed in configuration (under `output` property).

See below section for more information.

## AST compression

To compress the AST, two things are used:

* the compressor
* the names mangling

Both are used only if a corresponding configuration object has been created.

If the `compressor` configuration is not `false`, its computed value is forwarded to the constructor `UglifyJS.Compressor` to build a new compressor object, and then used to compress the AST.

If the `mangle` configuration is not `false`, its computed value is forwarded to the method `mangle_names` of the AST object in order to mangle the names.



# Check/Add dependencies: `CheckDependencies`

Checks/adds the dependencies of all the source files of a package. __It is important to use this visitor in order to actually fetch and add dependencies to a package__.  The dependencies are computed by calling the `computeDependencies` method of any visitor implementing it.

__When__: `onBeforeOutputFileBuild`

## Configuration

* `files`: files filtering property

Dependencies check:

* `noCircularDependencies`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: whether to allow [circular dependencies](https://en.wikipedia.org/wiki/Circular_dependency) or not.
* `addUnpackagedDependencies`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: whether to add missing dependencies or not.
* `unpackagedDependenciesError`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: if unpackaged dependencies are not added (`addUnpackagedDependencies` is `false`), whether to log an error with grunt in case of unpackaged dependencies or not.

Ordering:

* `checkPackagesOrder`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: whether dependencies should be forced to be included by the package or one that has been built before - in other words to avoid it to be packaged __after__  - or not. Indeed, in some cases some will be included after, as dependencies of other output files.
* `reorderFiles`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: controls the order of source files contained by the package: whether to keep the order in which source files have been encountered while processing dependencies, or to let the latter at the end of the list, as they were appended.

## Description

For each source file making this package, the dependencies are processed. See section below to know about the dependencies processing of a single file.

Once all dependencies have been processed, likely adding source files to the package, the work is over. However, if `reorderFiles` is `true`, the list of source files is put in the order in which dependencies have been encountered during the whole process.

### Single dependency processing

The dependencies processing is recursive, which means that as long as a file has dependencies, its dependencies will be looked for other dependencies.

During this lookup, circular dependencies are checked: any file that depends on a file which has already been processed is considered to have a circular dependency on the latter. If `noCircularDependencies` is `true`, anytime a circular dependency is found an error is logged using [`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error) specifying the list of concerned dependencies, and the current dependency processing is stopped.

Already processed files are skipped to avoid useless computations.

If a currently processed dependency is already associated to __another__ package __which has not yet been built__ and `checkPackagesOrder` is `true`, an error message will be logged using [`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error) to tell that a dependency file will be packaged after, and the current dependency processing is stopped.

If the currently processed dependency is not part of any package yet but `addUnpackagedDependencies` is `false`, the current dependency processing is stopped. Additionally, if `unpackagedDependenciesError` is `true`, and error is logged using [`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error) specifying the unpackaged dependency.

Finally, if everything went fine, the dependency is added to the package if it wasn't part of any other.



# Check global variables use: `CheckGlobals`

Checks global variables use.

__When__: `onWriteInputFile`

## Configuration

* `files`: files filtering property

Globals configuration:

* `strict`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: whether to use strict checking or not. In strict mode, a global must be explicitly allowed to be considered as accepted, while otherwise it must only not be forbidden.

Globals permissions:

1. `allowStdJSGlobals`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: whether to allow standard JavaScript globals or not (see below for a list).
1. `allowCommonJSGlobals`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `false`: whether to allow global defined by [CommonJS](http://wiki.commonjs.org/wiki/CommonJS) or not (see below for a list).
1. `allowedGlobals`, [`Array`](http://devdocs.io/javascript/global_objects/array) of [`String`](http://devdocs.io/javascript/global_objects/string), defaults to [`undefined`](http://devdocs.io/javascript/global_objects/undefined): if specified, the globals listed here are set as being allowed.
1. `forbiddenGlobals`, [`Array`](http://devdocs.io/javascript/global_objects/array) of [`String`](http://devdocs.io/javascript/global_objects/string), defaults to [`undefined`](http://devdocs.io/javascript/global_objects/undefined): if specified, the globals listed here are set as being forbidden.

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

## Description

Everytime a forbidden global is used in one of those files, an error will be logged using grunt ([`grunt.log.error`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error)), specifying which global was used and in which file.



# Remove JS Banner: `JSStripBanner`

Removes from the content of the file what is considered as a banner; content is considered itself as JavaScript source code.

__When__: `onWriteInputFile`

## Configuration

* `files`: files filtering property

Banners types:

* `line`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `false`: whether single line comments should be removed as well.
* `block`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `false`: whether all block comments should be removed unconditionally, or block comments with a specific syntax should be preserved.

## Implemented methods

A banner is a piece of comment put on top of the file, before any actual source code.

Here are the kind of comments removed, depending on the given configuration:

* `line` is `true`: `// ...` leading comments are removed
* `block` is `true`: `/* ... */` leading comments are removed
* `block` is `false`: `/* ... */` leading comments are removed, except those with an extra exclamation mark, like this: `/*! ... */`

You can see that anyway one type of block comments will be removed.



# Compile Atlas templates: `ATCompileTemplates`

Compiles Atlas templates.

__When__: `onWriteInputFile`

## Configuration

* `files`: files filtering property

## Description

In addition to the given `files` filter, if the file does not correspond to an actual template (we determine it if we can't find an associated parser), the file won't be processed.






# Compute Aria Templates dependencies: `ATDependencies`

Computes the dependencies of the given input file, and adds them to the latter.

__When__: `computeDependencies`

## Configuration

* `files`: files filtering property

Options:

* `mustExist`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: whether to be strict or not when finding dependencies. If `true`, determined dependencies must be found in the packaging.
* `externalDependencies`, [`Array`](http://devdocs.io/javascript/global_objects/array) of [`String`](http://devdocs.io/javascript/global_objects/string), defaults to `[]`: list of paths of dependencies to consider as external, and therefore which do not have to be inside the packaging.

## Description

Dependencies of the given input file are computed, and then actually specified as being dependencies of the file.

Note that dependencies must be part of the packaging already, either already added to it or present in its source directory.

If a dependency could not be found, is not part of the specified `externalDependencies` and if `mustExist` is `true`, then an error is logged.





# Remove Aria Templates documentation data: `ATRemoveDoc`

Removes chosen documentation data, which has an impact on package's size.

__When__: `onWriteInputFile`

## Configuration

* `files`, defaults to `['**/*.js']` (all JavaScript files): files filtering property

Elements to remove:

* `removeBeanDescription`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: remove the description of properties in Bean definitions.
* `removeEventDescription`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: remove the description of events in Aria object definitions.
* `removeErrorStrings`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `false`: remove the error strings. __See description for details__.
* `replaceStaticsInErrors`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `false`:  __see description for details__.

## Description

Error strings are removed from:

* `$statics` property of Aria Templates class definitions
* in function calls:
	* `$logError`
	* `$logWarn`
	* `$logInfo`
	* `_logError`



# Build an Aria Templates URL Map: `ATUrlMap`

Builds a [URL map](http://ariatemplates.com/usermanual/latest/url_handling), and exports it into an executable piece of JavaScript code, directly using the [`aria.core.DownloadMgr.updateUrlMap`](http://ariatemplates.com/aria/guide/apps/apidocs/#aria.core.DownloadMgr:updateUrlMap:method) method with this map.

__When__: `onAfterBuild`

## Configuration

Files filtering:

* `sourceFiles`: source files to take into account in the map
* `outputFiles`: output files to take into account in the map
* `onlyATMultipart`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: if `true`, only takes into account output files built with the `ATMultipart` builder.

Output map file specifications:

* `mapFile`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to `"map.js"`: name of the file into which the map should be output.
* `mapFileEncoding`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to [`null`](http://devdocs.io/javascript/global_objects/null) (uses [`grunt.file.defaultEncoding`](http://gruntjs.com/api/grunt.file#grunt.file.defaultencoding) instead): the encoding of the file to which the map is output.
* `outputDirectory`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to [`null`](http://devdocs.io/javascript/global_objects/null) (uses the packaging's directory instead): the directory of the map file.
* `append`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: if `true`, appends to the resolved map file if it exists, otherwise always creates a new one.

Compression of the map/code:

* `starCompress`, _glob pattern_, defaults to `["**/*"]` (all files): filters for files accepting to be star compressed (see the full description below for more about this concept).
* `starStarCompress`, _glob pattern_, defaults to `["**/*"]` (all files): filters for files accepting to be star-star compressed (see the full description below for more about this concept).
* `minifyJS`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `true`: if `true`, the generated code will be minified using `UglifyJS.minify` and the given/processed `minifyJSOptions`. Moreover.
* `minifyJSOptions`, [`Object`](http://devdocs.io/javascript/global_objects/object) with specific properties (see below), defaults to `{}`: the processed options will always have at least the following properties: `{fromString: true}`.
* `jsonIndent`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to _4 spaces_: the indentation string to use when serializing the map using [`JSON.stringify`](http://devdocs.io/javascript/global_objects/json/stringify). It is not relevant (unused) when `minifyJS` is `true`.

## Description

For a quick recap, an Aria Templates URL map maps classpaths to the actual file in which corresponding files are stored. Indeed, it allows to override the default behavior where one classpath corresponds exactly to one file path.

Example of such a map:

```json
{
	"A": {
		"B": {
			"X": "output/XY.js",
			"Y": "output/XY.js",
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

Once the map is built, if the given option `starCompress` evaluates to `true`, the star compression is applied, and afterwards star-star compression is applied if `starStarCompress` evaluates to `true`. See sections below for more information about these concepts.

Then, the map is serialized, and the piece of code is generated, generating a call to `aria.core.DownloadMgr.updateUrlMap` giving the previously serialized map as unique argument.

If `JSMinify` is `true`, the resulting piece of code is minified using `UglifyJS.minify`.

Then, the piece of code is output to the file corresponding to the joining of the `outputDirectory` path and the `mapFile`. If the file already exists, it is overwritten if `append` is `false`, otherwise the code is appended. If the file doesn't exist yet, it is created with the piece of code as content. Note that `mapFileEncoding` is used anyway, whether the file existed or not.

### Star compression

The goal of the map is to find the output file corresponding to a given classpath.

If we take the example above, we can see that `A.B.Z` will resolve to `Z.js`, but both `A.B.X` and `A.B.Y` will resolve to `XY.js`.

The star compression takes in a given module a group of classes mapped to the same output file, and removes all those mappings to replace them with a single generic one named `*`. This becomes a fallback when the class is not explicitly mapped.

With our previous example, this would give:

```json
{
	"A": {
		"B": {
			"*": "output/XY.js",
			"Z": "Z.js"
		}
	}
}
```

For best efficiency, the highest numbers of mappings will be removed, which means the star fallback will map to the output file with the highest number of classes.

__Note that to avoid a base classpath to be compressed - which means to receive a _star_ fallback - you can use the filter `starCompress`.__

### Star-star compression

The goal of star-star compression is the same: to gain some spaces in the map be grouping some entries.

The difference here is that it spans across several hierarchies of modules. Given another example:

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



# Normalize Aria Templates skin: `ATNormalizeSkin`

Normalizes Aria Templates skin definitions.

__When__: `onWriteInputFile`

## Configuration

* `files`, defaults to `['**/*.js']` (all JavaScript files): files filtering property

### Normalization options

* `jsonIndent`, [`String`](http://devdocs.io/javascript/global_objects/string), defaults to _4 spaces_: the indentation string to use.
* `strict`, [`Boolean`](http://devdocs.io/javascript/global_objects/boolean), defaults to `false`: whether to log actual error messages if there are errors, or to simply log warnings.

## Description

First note that in addition to the given `files` filter, files who don't define an Aria class with a classpath corresponding to the skin ([`aria.widgets.AriaSkin`](http://ariatemplates.com/aria/guide/apps/apidocs/#aria.widgets.AriaSkin)) will be skipped as well.

Then, it normalizes the skin definition using [`aria.widgets.AriaSkinNormalization.normalizeSkin`](http://ariatemplates.com/aria/guide/apps/apidocs/#aria.widgets.AriaSkinNormalization:normalizeSkin:method), replacing the content of the file if done with success, logging an error otherwise.




# Create custom visitors

It is possible to create custom visitors and use them in your atpackager configurations. As an example, you can take a look at the [custom visitors created for noderJS](https://github.com/ariatemplates/noder-js/tree/master/build/visitors).

## How to declare a custom visitor

You simply need to create file `atpackager.js` __at the root of your project__ which looks like this

```javascript
module.exports = function(atpackager) {
    require("./atpackager").init(atpackager);
    atpackager.visitors.MyFirstVisitor = require("./myVisitorsPath/MyFirstVisitor");
    atpackager.visitors.MySecondVisitor = require("./myVisitorsPath/MySecondVisitor");
};
```

This is what we call a __plugin__ for atpackager. It is important that you put the plugin file at the root of your project if you want external projects to use the custom visitors declared therein.
Plugins allow you also to declare [custom builders](./builders.html#create-custom-builders).

## How to use a custom visitor

If you have created a custom visitor and declared it in a plugin, you can use it within your project by loading the plugin

```javascript
require('atpackager').loadPlugin('./atpackager');
```

If you want to load atpackager plugins defined in a dependency (for example in [`noderJS`](http://noder-js.ariatemplates.com/)) in order to use the custom visitors they declare, you can use

```javascript
require('atpackager').loadNpmPlugin('noder-js');
```

This will load plugin `atpackager.js` at the root of `noder-js` dependency.