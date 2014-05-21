# Get started

## Introduction: what is atpackager?

atpackager (__Aria Templates Packager__) is a tool to create a __packaging__ of your product.

It is built in a generic way, so that it can be used for any type of project and easily extended. Its configuration of __packages__ is very simple to use.

atpackager comes with a set of built-in components, from simple files processing, to handling of content types such as JavaScript and also Aria Templates.

### What is packaging in a word?

The idea is to take a bunch of source files (code, documentation, resources, whatever), and to apply some transformations to their content and to their layout (it is possible to concatenate files, move them, etc.), in order to deliver the product in a tailored form for the desired purpose (usually for production).

### The atpackager design

_Here is a more formal description of the design of atpackager, which can help you understand the terminology present in the rest of the documentation._ Additional details are found elsewhere in the documentation.

A __packaging__ is mostly a set of __packages__. Apart from them, it contains global configuration and notably a list of __visitors__ (see below).

A __package__ results in __a single output file__, however its definition contains __information about how to build__ this output file, which notably implies a __builder__.

The whole process of building the packaging, from high-level to low-level operations, triggers events: __visitors__ can catch these events to alter or simply react to this process.

### The environment of atpackager

atpackager is built for [node.js](http://nodejs.org/), as a [Grunt](http://gruntjs.com/) plugin.





## Download

_[atpackager](https://www.npmjs.org/package/atpackager) is available on [npm](https://www.npmjs.org/)_

To install it inside your project, execute this:

```bash
npm install atpackager
```

Otherwise, include it as a dependency inside your `package.json` file.


## Configure

_[Full article on the configuration options](./configuration.html)_

atpackager is a tool, and it needs some instructions to do something, like: where to take files from, what to do with them, etc.

In general, there are several ways to pass such information to a tool, depending on its interface: command line arguments, "standard" configuration files, etc.

In the case of atpackager, since the latter is built as a Grunt plugin, this information will be passed as for other Grunt plugins: using a configuration object in the `Gruntfile.js` file. For more information about this file, you can have a look at [the Grunt website](http://gruntjs.com/sample-gruntfile).

The configuration is the most important topic concerning this tool, this is where you will tell atpackager how your packages have to be created.





## Execute

To execute atpackager and actually build the packaging, you will need to invoke grunt with the `Gruntfile` containing the configuration as discussed [above](#configure).

There are several ways to do this, please refer to the [Grunt website](http://gruntjs.com/getting-started) to learn about _standard_ ways. However, we quickly recap them below.

### Using the CLI program

If the Grunt CLI is globally installed (`npm install -g grunt-cli`), you can directly use it in the same folder where the `Gruntfile.js` file is: executing `grunt` will run the default task.

Note that it is still necessary to have the grunt package installed inside your project (`npm install grunt`), `grunt-cli` being only the command line interface to the former.

### Using the CLI function in Grunt directly

In our example below, we assume two things:

* the piece of JavaScript code is executed in the folder where the `Gruntfile.js` file is
* `grunt` can be required with an absolute id (no relative path)

```javascript
var grunt = require("grunt"); // found in a node_modules folder

grunt.cli({
	gruntfile: __dirname + "/Gruntfile.js" // Gruntfile.js file in current module's folder
});
```

The list of available options can be seen in this source file [grunt/lib/grunt/cli.js](https://github.com/gruntjs/grunt/blob/master/lib/grunt/cli.js).