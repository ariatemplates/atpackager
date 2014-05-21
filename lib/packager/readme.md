Files and packages specifications.

# File system layout

* [`readme.md`](./readme.md): this current documentation file

Classes:

* [`outputFile.js`](./outputFile.js): [`OutputFile`](#output-file)
* [`sourceFile.js`](./sourceFile.js): [`SourceFile`](#source-file)
* [`packaging.js`](./packaging.js): [`Packaging`](#packaging)




----





# Output file

* Name: `OutputFile`

Represents how an output file must be built.

Generic information is used for that:

* input: a list of source files
* output: a wanted output path
* context: the containing packaging

## Constructor parameters

1. `packaging`: see corresponding [instance property](#instance-properties)
1. `logicalPath`: see corresponding [instance property](#instance-properties)

## Instance properties

* `packaging`
	* interface: [`Packaging`](#packaging)
	* __required__
	* rights: access
	* Packaging which contains this output file.
* `logicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* rights: access
	* The path of the file relative to the packaging output path.
* `sourceFiles`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of [`Source File`](#source-file)
	* default: `[]`
	* rights: access, reordering. Adding and removing elements should be done by calling prototype method [`setOutputFile`](#set-the-output-file-this-source-file-is-targeting) of [`Source File`](#source-file) objects (this is an inversion of responsibility).
	* Source files to be included into this output file.
* `outputPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* initial value: [`null`](http://devdocs.io/javascript/global_objects/null)
	* rights: access
	* This property is updated with the complete output path just before the builder is called to build the output file. It is the result of joining the [packaging's `outpoutDirectory` property](#instance-properties_2) and the [instance property]((#instance-properties)) `logicalPath`.
* `builder`
	* interface: `Builder`
	* default: [`null`](http://devdocs.io/javascript/global_objects/null) at instantiation, and then when calling the method [`build`](#build): `this.packaging.createObject(this.packaging.defaultBuilder, this.builtinBuilders)`
	* rights: set, access
	* The builder to use.
* `finished`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* initial value: [`false`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript)
	* rights: access
	* [`false`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) until the first time the output file is [built](#build), [`true`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) afterwards.



## Prototype attributes

* `builtinBuilders`: collection of the [builders shipped with AT Packager](../builders), equivalent of the property `builders` in module file [`atpackager`](../atpackager.js)

## Prototype methods



### Logical file path match test

* Name: `isMatch`

Whether the logical path of this output file matches the given patterns.

#### Parameters

1. `patterns`
	* interface: as expected by first parameter of method [`grunt.file.isMatch`](http://gruntjs.com/api/grunt.file#grunt.file.ismatch).
	* __required__
	* __in__
	* The list of patterns to match.

#### Return value

* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
* [`true`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) if the [`logicalPath`]((#instance-properties)) matches all the given `patterns`, [`false`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) otherwise

#### Description

Uses the [`grunt.file.isMatch`](http://gruntjs.com/api/grunt.file#grunt.file.ismatch) method to test individual matches.



### Build

* Name: `build`
* _No parameter_
* _No return value_

Builds the content of the output file from all the source files (referenced by instance property [`sourceFiles`](#instance-properties)), using the builder (referenced by instance property [`builder`](#instance-properties)), and writes this content to the disk under path specified by instance property [`outputPath`](#instance-properties).

Visitors' `onBeforeOutputFileBuild` method is called on this file before the builder's build process is called, and `onAfterOutputFileBuild` method is called after this process has been completed.

After this function has executed properly, instance property [`finished`](#instance-properties) is set to [`true`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript).

If no builder was specified and no default one could be created from the packaging, [an error is logged using `grunt`](http://gruntjs.com/api/grunt.log#grunt.log.error-grunt.verbose.error) and the function execution is aborted.





----





# Source file

* Name: `Source file`

Represents a source file.


## Constructor parameters

1. `packaging`: see corresponding [instance property](#instance-properties_1)
1. `logicalPath`: see corresponding [instance property](#instance-properties_1)



## Instance properties

* `packaging`
	* interface: [`Packaging`](#packaging)
	* __required__
	* rights: access
	* Packaging which contains this source file.
* `logicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* rights: access
	* Logical path of the file.
* `contentProvider`
	* interface: `Content Provider`
	* default: built-in content provider `fileLoader`
	* rights: set, access
	* The content provider used to get the content corresponding to this source file.
* `outputFile`
	* interface: [`OutputFile`](#output-file)
	* initial value: [`null`](http://devdocs.io/javascript/global_objects/null)
	* rights: access. Set it using the method [`setOutputFile`](#set-the-output-file-this-source-file-is-targeting).
	* The output file this source file is targeting.
* `dependencies`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of [`SourceFile`](#source-file)
	* initial value: [`null`](http://devdocs.io/javascript/global_objects/null)
	* rights: access
	* Source files on which this current source file depends. They are assured to belong to the same packaging as this source file. This property is filled and/or used by visitors.



## Prototype attributes

* `builtinBuilders`: the [builders shipped with AT Packager](../builders), equivalent of the property `builders` in module file [`atpackager`](../atpackager.js)



## Prototype methods



### Set the output file this source file is targeting

* Name: `setOutputFile`
* _No return value_

#### Parameters

1. `outputFile`
	* interface: [`Output File`](#output-file)
	* default: void
	* __in & out__
	* The output file (destination) this source file will contribute to.

#### Description

If the exact same output file was already set, this function won't do anything.

Otherwise, sets the instance property [`outputFile`](#instance-properties_1) to given `outputFile`.

If the new output file is valid (non void), it will add this source file to its list of input files.

Also, if another (valid) output file had been already set before, it will remove this source file from its list of input files.



### Get the content of the file

There are actually two methods for that:

* `getTextContent`: for text content
* `getBinaryContent`: for binary content
* __Delegated__

Delegates to instance property [`contentProvider`](#instance-properties_1)'s `getTextContent` method for text content and `getBinaryContent` method for binary content, both applied on this file.

#### Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

If no [`contentProvider`](#instance-properties_1) was specified.



### Set the content of the file

There are actually two methods for that:

* `setTextContent`: for text content
* `setBinaryContent`: for binary content
* __Delegates__
* _No return value_

Sets the instance property [`contentProvider`](#instance-properties_1) to a built-in content provider and delegates to one of its method. For text content, it uses the `textContent` content provider and its method `setTextContent`. For binary content, it uses the `binaryContent` content provider and its method `setBinaryContent`. In both cases, the method is applied on this file and parameters are forwarded.



### Logical file path match test

* Name: `isMatch`

Whether the logical path of this output file matches the given patterns.

#### Parameters

1. `patterns`
	* interface: as expected by first parameter of method [`grunt.file.isMatch`](http://gruntjs.com/api/grunt.file#grunt.file.ismatch).
	* __required__
	* __in__
	* The list of patterns to match against.

#### Return value

* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
* [`true`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) if the `logicalPath` matches all the given patterns, [`false`](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) otherwise

#### Description

Uses the [`grunt.file.isMatch`](http://gruntjs.com/api/grunt.file#grunt.file.ismatch) method.



### Get dependencies

* Name: `getDependencies`
* _No parameter_

If instance property [`dependencies`](#instance-properties_1) already contains a non-void value, returns it.

Otherwise, sets it to an empty array (`[]`), and calls the visitors' `computeDependencies` method applied on this file in order to let them fill this array.

#### Return value

The dependencies of the file, stored or freshly computed.



### Add a dependency

* Name: `addDependency`
* _No return value_
* __Should be called only by visitors, from their `computeDependencies` method__

Adds the given source file as a dependency of this source file.

If the dependency is already present, does nothing.

#### Parameters

1. `otherSourceFile`
	* interface: [`Source file`](#source-file)
	* __required__
	* __in__
	* A source file on which this source file depends.



### Clear the content of the file

* Name: `clearContent`
* _No parameter_
* _No return value_

Clears all the content stored on this object.

#### Description

Content providers are supposed to store their associated content on this object, prefixing the names of their properties with the text `content`. This method clears all the properties this object contains and whose names start with `content`.





----





# Packaging

* Name: `Packaging`

Represents a packaging.

## Description

A packaging is an object which holds information about how to [build](#build-the-package) a package.

A package is made of [files](#add-a-file), and they are represented in the packaging as [`Output File`](#output-file) instances. These files know how to [build](#build) themselves from a list of source files [they hold](#instance-properties), but which gets [altered by the packaging when new content is being added](#add-a-package).

Therefore, the packaging contains a set of output files.

In addition to that, it also contains information about inputs:

* a set of [`Source File`](#source-file) instances (even though a bit redundant with the lists stored by output files)
* a list of source directories into which files are looked up when not added with absolute paths

Finally, a packaging has an output directory, into which the build of output files should write.

In order to create packages, files contained in the packaging should specify only relative (called logical) paths. They are resolved when needed in the context of the packaging.

## Some concepts

### Logical path

We name _logical path_ a path internal/relative to the packaging.

### Path normalization

Unless specified, the paths given to method for any kind of file are normalized using [Node.js `path` module's `normalize` method](http://devdocs.io/node/path#path_path_normalize_p).

This assures that two equivalent paths finally resolving to a same one are actually considered the same.

### Visitors

We say several times that visitors are called, it is done using the method [`callVisitors`](#call-visitors), so you can refer to its documentation to know what it implies. We also say that _visitors' method is called_, which specify which method name we send to this same function (again, please refer to its documentation).



## Instance properties

* `sourceDirectories`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array)
	* default: `[]`
	* rights: access
	* Directories where logical paths are looked for.
* `sourceFiles`
	* interface: Map of [`Source file`](#source-file)
	* default: `{}`
	* rights: access
	* The packaging's source files indexed by their logical paths.
* `outputDirectory`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* default: `"."` (current working directory)
	* rights: access
	* Directory in which packages are written.
* `outputFiles`
	* interface: Map of [`Output file`](#output-file)
	* default: `{}`
	* rights: access
	* The packaging's output files indexed by their logical paths.
* `outputFilesQueue`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array)
	* default: `[]`
	* rights: access. Items are added when calling the prototype method [`addOutputFile`](#add-a-file).
	* Queue of output files to be built. Files will be built in this order, and removed from this queue once built. This is used by the method [`build`](#build-the-package).
* `visitors`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of `Visitor`
	* default: `[]`
	* rights: access. Add visitors using method [`addVisitors`](#add-visitors).
	* The list of visitors this package uses.
* `defaultBuilder`
	* interface: Builder
	* default: [`null`](http://devdocs.io/javascript/global_objects/null)
	* rights: set, access
	* Default builder to be used by output files which don't specify any builder.



## Prototype properties

* `builtinVisitors`: collection of the [visitors shipped with AT Packager](../builders), equivalent of the property `visitors` in module file [`atpackager`](../atpackager.js)



## Prototype methods



### Call visitors

* Name: `callVisitors`

Calls the given method - if defined - on all visitors used by this package (stored in instance property [`visitors`](#instance-properties_2)), with the given arguments.

#### Parameters

1. `method`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The name of the method to call.
1. `args`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array)
	* __required__
	* __in__
	* The (partial) list of arguments to pass to the method.

#### Description

Arguments are expanded by using [`apply`](http://devdocs.io/javascript/global_objects/function/apply). Note that an additional argument is prepended before the call: a reference to this packaging instance.

So it more or less corresponds to the following code (pseudo-code: `in` loops on an array, `++` concatenates two arrays, `this` is the package instance):

```livescript
for visitor in this.visitors => visitor[method].apply(visitor, [this] ++ args)
```



### Add visitors

* Name: `addVisitors`
* _No return value_

Adds visitors to this packaging.

#### Parameters

1. `visitorsArray`
	* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of `Visitor`'s description. See prototype method `createObject`.
	* __required__
	* __in__
	* A list of visitor's description to create and add new visitors.

#### Description

Each item of the array is passed to the method `createObject`, passing the map of built-in visitors (property `builtinVisitors`) as second argument, and this is the result of the latter which is appended to the list of visitors (instance property `visitors`). So please refer to that method's documentation to know what kinds of values you can actually pass, it directly depends on it.


<!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->


### Add a file

Adds either an input or an output file.

There are actually two methods for that:

* `addSourceFile`: will add a [source file](#source-file), referring to its map `sourceFiles`
* `addOutputFile`: will add an [output file](#output-file), referring to its map `outputFiles`

#### Parameters

1. `logicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The path to add as a file. It is normalized using Node.js `path` module's `normalize` method.
1. `mustCreate`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: [falsy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript)
	* __in__
	* If [truthy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) and path already present, makes the function fail.

#### Description

If file is already present in the map: does nothing except returning the corresponding file if `mustCreate` is [falsy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript), otherwise throws an error.

Otherwise, it will create a new file, passing the given path, and add it to its map. It will eventually return this new instance, but before it will call the visitors' `onAddSourceFile` method for source files and `onAddOutputFile` method for output files, passing the file instance as argument.

There is only one little difference in the case of the output file: the newly created instance is also added to the instance property [`outputFilesQueue`](#instance-properties_2), before the visitors are called.

#### Return value

The file corresponding to the given path, whether it was already present or freshly created.

#### Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

Thrown if `mustCreate` is [truthy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) and given path is already present.



### Get a file

Returns the file instance corresponding to the given path if it has been added to the packaging yet.

There are actually two methods for that:

* `getSourceFile`: to request a source file, using [`sourceFiles`](#instance-properties_2) internally
* `getOutputFile`: to request an output file, using [`outputFiles`](#instance-properties_2) internally

#### Parameters

1. `logicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The path corresponding to the requested file.

#### Description

Internally, it uses one of its map, the only added value being that the given path is normalized to ensure to get the proper entry.

#### Return value

The file corresponding to the given path if it exists, [`undefined`](http://devdocs.io/javascript/global_objects/undefined) otherwise.



### Add a package

* Name: `addPackage`
* _No return value_

Adds a package (equivalent to a configuration of an output file with builder and source files) to this packaging.

#### Parameters

1. `packageDesc`
	* interface: [`Object`](http://devdocs.io/javascript/global_objects/object). See description below.
	* __required__
	* __in__

Here are the properties of the package description object:

* `name`
	* __required__
	* Equivalent to the logical path of the corresponding output file.
* `builder`
	* interface: as expected by method `createOject`
	* __optional__
	* The builder - or its specifications to create it - to be used for the corresponding output file.
* `files`
	* interface: as expected by method `addSourceFiles`
	* __optional__
	* The paths of the source files making the corresponding output file.

#### Description

This method is a kind of helper to do a lot of things with simple input. Everything is created through factories, so you can pass already existing instances, or values used to retrieve them, or even (for some) configuration objects to be used to create them.

In fact, a package corresponds to an output file, for which a builder and a set of source files are optionally specified.

* the output file is created / retrieved using method `addOutputFile`
* the builder is created / used directly using method `createOject`
* the source files are created / retrieved using method `addSourceFiles`

You can refer to those methods to know more about their capabilities.

Here is now the procedure of the method.

Once the output file is created or retrieved, the method attempts to set its builder, if the package description specifies one. If a builder was already set for the output file (in case it was just retrieved then), an exception is thrown. Otherwise, it creates / retrieves the builder from the specifications and sets it, assigning it to the output file's property `builder`.

After that, if no source file is specified in the package description, the procedure is finished. Otherwise, it will add those source files to both the packaging and the output file. This process will either create or retrieve existing source files. Note that if ever one source file is simply retrieved, and its output file is already set to one which is not the output file this package corresponds to, the method will thrown an error!

#### Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

There are two similar cases where an exception is thrown:

* if the package specifies a builder, and if the output file existed and already had a builder specified, unconditionally fails (even if the two builders are the same in the end)
* if one source file is already existing and already has an output file configured, fails if it is not the same as the output file corresponding to the package



<!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->


### Expand logical paths

* Name: `expandLogicalPaths`

The goal of this method is to return a list of paths build from added source files and files in added source directories, the whole filtered against the given patterns.

#### Parameters

1. `patterns`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* Patterns to which the paths must match.
1. `onlyAlreadyAdded`
	* interface: [`Boolean`](http://devdocs.io/javascript/global_objects/boolean)
	* default: [falsy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript)
	* __in__
	* If [truthy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript), only use already added source files.

#### Description

It uses [grunt file utilities](http://gruntjs.com/api/grunt.file) to filter lists of paths with given patterns.

The first input list of paths is built from the instance property [`sourceFiles`](#instance-properties_2) map's keys, which gives absolute paths. This list is filtered against the given `patterns` to build a first result, by using [`grunt.file.match`](http://gruntjs.com/api/grunt.file#grunt.file.match).

If given options `onlyAlreadyAdded` is [truthy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript), this result is returned directly.

Otherwise, it will repeat the process above with new lists of files, taken from the directories listed in instance property [`sourceDirectories`](#instance-properties_2) (not recursively). The new results are concatenated to the first one. (for information, this part is done using [`grunt.file.expand`](http://gruntjs.com/api/grunt.file#grunt.file.expand).)

#### Return value

* interface: [`Array`](http://devdocs.io/javascript/global_objects/array) of [`String`](http://devdocs.io/javascript/global_objects/string)

The final list of paths.



### Resolve a relative path against the packaging's one

* Name: `getAbsolutePath`

#### Parameters

* `logicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The relative path to resolve.

#### Description

The operation resolves the given logical path against the path of the packaging, to give an absolute path. However, this is not a pure path manipulation, the result must resolve to an existing node in the file system to be considered as valid, otherwise nothing is returned.

#### Return value

The absolute path of the file if found, [`null`](http://devdocs.io/javascript/global_objects/null) otherwise.


<!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->


### Add source files

* Name: `addSourceFiles`

#### Parameters

1. `patterns`
	* interface: same as in prototype method `expandLogicalPaths`
	* __required__
	* __in__
	* Passed to method `expandLogicalPaths` to get a list of paths.

#### Description

Expands the given `patterns` to a list of paths using the method [`expandLogicalPaths`](#expand-logical-paths) (passing a [falsy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript) value for the second argument, otherwise it makes no sense), and then uses the method [`addSourceFile`](#add-a-file) to add each of them. Using [`expandLogicalPaths`](#expand-logical-paths) like this means that files are resolved from added [`sourceDirectories`](#instance-properties_2).

#### Return value

Returns an array containing the results to each call to the method [`addSourceFile`](#add-a-file).



### Add packages

* Name: `addPackages`
* _No return value_

#### Parameters

1. `packagesArray`
	* type: [[`Array`](http://devdocs.io/javascript/global_objects/array)](http://devdocs.io/javascript/global_objects/array) of items as expected by the prototype method [`addPackage`](#add-a-package). However, the following is also supported:
		* passing a single item (not in an [array](http://devdocs.io/javascript/global_objects/array) at all)
		* putting items that are strictly of type [`Array`](http://devdocs.io/javascript/global_objects/array), and this recursively. The process will treat that as a flattened array.
	* __required__
	* __in__
	* The (ordered) set of packages to add to this packaging.

#### Description

Adds the given items using the method [`addPackage`](#add-a-package). The given `packagesArray` is treated as a flat array.


<!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->



### Rename an output file

* Name: `renameOutputFile`

Renames the specified output file from this packaging.

#### Parameters

1. `oldLogicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* The logical path of the source file, as it is currently set.
1. `newLogicalPath`
	* interface: [`String`](http://devdocs.io/javascript/global_objects/string)
	* __required__
	* __in__
	* the new, desired logical path for the source file corresponding to the given `oldLogicalPath`.

#### Description

First note that nothing is done if the new path doesn't differ from the old one.

Otherwise, it logically renames the file, setting its instance property `logicalPath` with `newLogicalPath`. In addition to that, it checks if the file exists on storage device (using [Node.js `fs.existsSync` method](http://devdocs.io/node/fs#fs_fs_existssync_path)), and if so renames it there too. This process updates the file's instance property `outputPath`.

#### Return value

* interface: [Output file](#output-file)

The renamed file.

#### Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

If the original source file could not be found.


<!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->


### Initialize

* Name: `init`
* _No parameter_
* _No return value_

Calls the visitors' `onInit` method (without any argument). This method should be called before adding any source file or package and after adding all visitors.



### Build the package

* Name: `build`
* _No parameter_
* _No return value_

#### Description

Builds all the output files present in the instance property [`outputFilesQueue`](#instance-properties_2): this is a queue, so they will be built in the order they were added ([FIFO](https://en.wikipedia.org/wiki/FIFO)).

Each output file is built by calling its own method `build`.

Visitors are called at different steps of the process, here is a description:

* `onBeforeBuild`, _no argument_: once, at the very beginning of the method. You can do anything you want, including altering the queue of output files.
* `onReachingBuildEnd`, _no argument_: everytime the queue of output files gets empty. you can use it to add new files to the queue, the process will continue, and this visitors' method will be called again when the queue's size reaches 0.
* `onAfterBuild`, _no argument_: once, at the very end of the method. Whatever you do, the method is finished afterwards.


<!-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -->


### Create an instance of a certain type from a configuration object

* Name: `createObject`

A [factory](https://en.wikipedia.org/wiki/Factory_method_pattern) to create instances:

* return them if already created (ensuring role)
* create them from a passed configuration object if possible

#### Parameters

1. `cfg`
	* type: there are several possibilities (checked in order):
		1. [`Object`](http://devdocs.io/javascript/global_objects/object) with a property named `type` (at least). See description below.
		1. a type matching one possible type for the `type` property of the configuration object. See description below.
		1. anything else: considered as being the instance already built
	* __required__
	* __in__
	* The configuration object (or a value to build it), which specifies how to create an instance, or the instance already (the method is a [factory](https://en.wikipedia.org/wiki/Factory_method_pattern)).
1. `builtinMap`
	* interface: Mapping
	* __required__: if the `type` specified in the configuration object is a [`String`](http://devdocs.io/javascript/global_objects/string)
	* __in__
	* A map of constructors indexed by their names. That way, an instance can be built using one of those, and specifying them by their names.

Here are the properties of the configuration object:

* `type`
	* type: [`String`](http://devdocs.io/javascript/global_objects/string) or [`Function`](http://devdocs.io/javascript/global_objects/function)
	* __required__
	* __in__
	* The constructor, or the name of the latter in some available maps, to be used to create the new instance.
* `cfg`
	* type: any
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* __in__
	* The unique argument passed to the constructor when invoked.
* `instance`
	* type: any
	* default: [`undefined`](http://devdocs.io/javascript/global_objects/undefined)
	* __in & out__
	* Added or read by the method, it stores the instance created using this configuration object.

The configuration can be passed directly, in which case it will live outside of the method, and therefore external world will be able to access it _new_ property `instance`. Otherwise, a [`String`](http://devdocs.io/javascript/global_objects/string) or [`Function`](http://devdocs.io/javascript/global_objects/function) value can be passed, in which case a local configuration object will be built with its property `type` set to this value.

#### Description

_Please read carefully the rest of the documentation of this method to have more precise details._

If the argument `cfg` is considered to be the instance, it is simply returned and the method doesn't do anything else. Also, if the argument `cfg` is actually a configuration object and contains a property `instance` which is not [falsy](https://en.wikipedia.org/wiki/Boolean_data_type#Python.2C_Ruby.2C_and_JavaScript), it is returned the same way.

So here is the situation where the instance is actually attempted to be built.

If the `type` specified is not a function (constructor) but a string instead, a function is attempted to be retrieved from the given `builtinMap`, by passing the value specified in `type` as index.

At that stage the method must have a function, otherwise an exception is thrown. This function is called as a constructor, using the [`new`](http://devdocs.io/javascript/operators/new) operator, and passing as single argument the value of the property `cfg` of the configuration object. The resulting value is the instance, stored in the configuration object under the property `instance`, and then returned.

#### Return value

* type: any

Either the passed value (`cfg`) if not considered as a configuration object, or the freshly created or stored instance.

#### Exceptions

* type: [`Error`](http://devdocs.io/javascript/global_objects/error)

In case a configuration object was actually used (passed or built through the `cfg` argument), but in the end its `type` property wasn't resolved to a [`Function`](http://devdocs.io/javascript/global_objects/function).
