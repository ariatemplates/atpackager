title: Configuration
page: configuration
---
atpackager is built as a Grunt plugin and therefore expects it configuration to be passed using [`grunt.initConfig`](http://gruntjs.com/api/grunt.config#grunt.config.init) in the `Gruntfile.js` file.

Here is an example of such a file:

```javascript
module.exports = function (grunt) {
	grunt.file.setBase(__dirname + "...");
	grunt.loadTasks(".../atpackager/tasks");

	grunt.initConfig({
		atpackager: {
			build: {
				options: {
					// sourceDirectories,
					// outputDirectory,
					// ATDirectories,
					// ATBootstrapFile,
					// ATAppEnvironment,
					// sourceFiles,
					// defaultBuilder,
					// packages,
					// visitors,
					// onlySourceFiles
				}
			}
		}
	});

	grunt.registerTask('default', [
		'atpackager:build'
	]);
};
```

The rest of this documentation mainly discusses the actual configuration of atpackager, namely the `options` object you can see in the snippet of code.




# General configuration not specific to atpackager

## Set the base directory of the project

This is the equivalent of the _current working directory_, but for Grunt.

```javascript
grunt.file.setBase("...");
```

Replace `...` with the actual path to the root of the project.

## Load atpackager tasks

```javascript
grunt.loadTasks(".../atpackager/tasks");
```

Replace `...` with the actual path to the `atpackager` module.




# atpackager specific configuration

Note that since it is a Grunt plugin, atpackager uses a lot of the latter's features. Notably regarding paths for files and folders specifications: [globs](https://github.com/isaacs/node-glob) are accepted.

Note also the following terms and concepts used in this article:

* a _packaging_ is what is built by the packager from the configuration object
* the _packager_ is what builds the packaging
* a _package_ is a configuration from which a single output file is built: a packaging is made of a set of them, as mentioned in the [introduction](./getstarted.html#the-atpackager-design)
* a _logical path_ is a path relative to the packaging (which can have several roots!)

## Input content (files and folders)

Use `sourceDirectories` to specify the packaging's root folders' paths. It is used to search for files specified with a logical path. The root folders' paths however are either absolute or relative to the base path configured for Grunt.

Then, you can use `sourceFiles` to populate the packaging with source files. These source files include both those used directly to build output files, and those used for other purposes (direct copy, dependencies computation, etc.). Logical paths are expected.

Example:

```javascript
{
	// ...
	sourceDirectories: [
		'src/main/static',
		'...'
	],
	sourceFiles: [
		'**/*.js',
		'...'
	]
	// ...
}
```

## Output directory

Use the `outputDirectory` option to tell in which directory to put the built packages. This one is relative to the base path configured for Grunt.

Example:

```javascript
{
	// ...
	outputDirectory : 'target/static'
	// ...
}
```

## Packages definition

Pass to the `packages` option a list of packages definitions.

A package is a single output file resulting from a building process applied on a set of input files.

Therefore a package definition is made of the following properties:

* `name`: the name of the resulting file
* `builder`: the [builder configuration](#builder-configuration) to use to create the output file from the input files.
* `files`: the list of input files to be processed by the `builder` to create the output file with given `name`

If the list of included files contains some files that are excluded from the global `sourceFiles`, they will be added or not according to the value of option `onlySourceFiles`: if set to true, the extra files required by the package will not be added.
The default value for `onlySourceFiles` is `false`. It is always advisable to set it to `true` in order to limit the recursive inspection of the source directories in search for files to add.

Note that this list of input `files` will possibly be extended by some specific visitors if needed.

Example of a package definition:

```javascript
{
	name: "basename.ext",
	files: [
		"...",
		// ...
	],
	builder: {
		// ...
	}
}
```

You can also specify a default builder for packages: it will be used when no explicit builder is specified for a given package. Simply put a [builder configuration](#builder-configuration) in `defaultBuilder`.

### Builder configuration

A builder specifies the way input files have to be merged in order to create a package. There are many [built-in builders](./builders.html) available. In order to specify the builder configuration you can:
* either simply use its __type__:
```javascript
{
	// ...
	builder: "JSConcat"
}
```
* or a more complex object which contains its type and a configuration object:
```javascript
{
	// ...
	builder: {
		type: "JSConcat",
		cfg: {// The configuration of object
				// ...
		}
	}
}
```

## Visitors specifications

Use `visitors` to specify the list of visitors to be used in the packaging. Please see the [dedicated section about visitors](./visitors.html) to learn about their role.
You can add a visitor in the `visitors` array by using:
* either simply its __type__:
```javascript
{
	visitors: ["JSMinify"]
}
```
* or a more complex object which contains its type and a configuration object:
```javascript
{
	visitors: [
		"JSMinify",
		{
			type: "TextReplace",
			cfg: {
				// its configuration
			}
		}
	]
}
```

It is important to note that visitors are called in the order in which they were specified.

See [here](./visitors.html) for a detailed list of built-in visitors.


## Aria Templates specific

The `ATBootstrapFile` option expects the path of a custom bootstrap file to be used to load Aria Templates. This path can be relative to the `sourceDirectories` configured for the packaging.
However, it is better to set property `ATDirectories` and avoid to include the directory containing Aria Templates framework from the general sources.

Having such a custom bootstrap file can be necessary in the case of pre-compilation of Atlas templates. Templates pre-compilation can depend on some application environment variables. In order to set the desired environment variables, there are two options:

* either use the standard Aria Templates bootstrap file as `ATBootstrapFile`, and the appropriate configuration variable `ATAppEnvironment` for the environment, as shown below:
	```javascript
	{
		// ...
		ATBootstrapFile: 'aria/aria-templates.js',
		ATAppEnvironment: {
			defaultWidgetLibs : {
				'aria': 'aria.widgets.AriaLib',
				'embed': 'aria.embed.EmbedLib',
				'html': 'aria.html.HtmlLibrary'
			}
		}
		// ...
	}
	```

* or create an ad-hoc bootstrap file which loads the standard bootstrap and then directly calls the methods that are available in the framework. Such a file would look like this
	```javascript
	// Loading the normal Aria Templates bootstrap file:
	load('aria/aria-templates.js');

	// Setting the environment for template pre-compilation:
	aria.core.AppEnvironment.setEnvironment({
		defaultWidgetLibs : {
			'aria': 'aria.widgets.AriaLib',
			'embed': 'aria.embed.EmbedLib',
			'html': 'aria.html.HtmlLibrary'
		}
	});
	```
