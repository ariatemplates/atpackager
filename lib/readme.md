# File system layout

* [`readme.md`](./readme.md): this current documentation file
* [`atpackager.js`](./atpackager.js): module entry point. Exports:
	* Shortcuts:
		* `grunt`: the global unique grunt instance
		* `uglify`: reference to the `uglify-js` package
		* `Packaging`: [`packager/packaging`](./packager/packaging)
	* full modules (using `requireDirectory`):
		* `uglifyHelpers`: [`uglifyHelpers`](./uglifyHelpers)
		* `builders`: [`builders`](./builders)
		* `contentProviders`: [`contentProviders`](./contentProviders)
		* `visitors`: [`visitors`](./visitors)



## Sub modules

Exported for the user:

* [`builders`](./builders): built-in builders
* [`visitors`](./visitors): built-in visitors
* [`contentProviders`](./contentProviders): built-in content providers

Internal:

* [`packager`](./packager): the packager implementation
* [`uglifyHelpers`](./uglifyHelpers): helpers for uglify-js

## Files

### Packager implementation

* [`main.js`](./main.js): controls the workflow of the packager: loads plugins, calls them with the instance of atpackager once grunt has been initialized

### Aria Templates specific features

* [`ATGetDependencies.js`](./ATGetDependencies.js): returns the list of dependencies of an Aria Templates file (dependencies are expressed as logical paths to the required classes)
* [`ATInPackaging.js`](./ATInPackaging.js): ensures an Aria Templates context is created for the given packaging object. Returns this context.
* [`ATRemoveDoc.js`](./ATRemoveDoc.js): removes some content from Aria Templates objects, related to pure documentation or development purposes

### Adapters

* [`ariatemplates.js`](./ariatemplates.js): adapter to make the local installation of Aria Templates work (since here it is not used inside a browser)
* [`grunt.js`](./grunt.js): implements a singleton pattern for a grunt instance. One can give the unique instance whenever it wants, and then access it. Functions using this instance can also register, being called immediately if the instance is already available, or later on (in registration order) as soon as this instance becomes available.

### Utilities

* [`requireDirectory.js`](./requireDirectory.js): requires all JavaScript files in a given folder, and returns a map with the created modules. Indexes are file names without the `.js` extension, entries are the modules.
* [`findFile.js`](./findFile.js): searches for a file inside a given list of folders. Returns its absolute path if found, `null` otherwise.
