# Get started

## Introduction: what is atpackager?

atpackager (__Aria Templates Packager__) is a tool to create a __packaging__ of your product, of any kind since its core features deal with processing files and folders.

It is built in a generic way, so that it can be easily extended and the configuration of __packages__ feels natural.

atpackager comes with a set of built-in components, from simple files processing, to handling of content types such as JavaScript and also Aria Templates.

### What is packaging in a word?

The idea is to take a bunch of source files (code, documentation, resources, whatever), and to apply some transformations to their content and to their layout (it is possible to concatenate files, move them, etc.), in order to deliver the product in a tailored form for whatever purpose (usually for production).

### The atpackager design

_Here is a more formal description of the design of atpackager, which can help you understand the terminology present in the rest of the documentation._ Additional details are found elsewhere in the documentation.

A __packaging__ is mostly a set of __packages__. Apart from them, it contains global configuration and notably a list of __visitors__ (see below).

A __package__ results in __a single output file__, however its definition contains __information about how to build__ this output file, which notably implies a __builder__.

The whole process of building the packaging, from high-level to low-level operations, triggers events: __visitors__ can catch these events to alter or simply react to this process.

### The environment of atpackager

atpackager is built for [node.js](http://nodejs.org/), as a [Grunt](http://gruntjs.com/) plugin.





## Download

### Using npm

_[atpackager](https://www.npmjs.org/package/atpackager) on [npm](https://www.npmjs.org/)_

This is the easiest way, and we assume you have a basic knowledge of what npm is.

To install it inside your project, execute this:

```bash
npm install atpackager
```

### Using Maven

atpackager is also available as a Maven artifact. Its name is `aria-templates-build-dependencies` (`artifactId`) and it is a `zip` file.

Here is a sample plugin section you can tweak and add to your `pom.xml` configuration file in order to download this artifact and extract it to the `target/at-packaging` folder automatically during the build:

```xml
<project>
	<build>
		<plugins>
			<plugin>
				<groupId>org.apache.maven.plugins</groupId>
				<artifactId>maven-dependency-plugin</artifactId>
				<version>2.6</version>
				<executions>
					<execution>
						<id>unpack-atpackager</id>
						<phase>initialize</phase>
						<goals>
							<goal>unpack</goal>
						</goals>
						<configuration>
							<artifactItems>
								<artifactItem>
									<groupId>com.ariatemplates</groupId>
									<artifactId>aria-templates-build-dependencies</artifactId>
									<version>1.0.0</version>
									<type>zip</type>
								</artifactItem>
							</artifactItems>
							<outputDirectory>target/at-packaging</outputDirectory>
						</configuration>
					</execution>
				</executions>
			</plugin>
		</plugins>
	</build>
</project>
```





## Configure

_[Full article on the configuration options](./configuration.html)_

atpackager is a tool, and it needs some instructions to do something, like: where to take files from, what to do with them, etc.

In general, there are several ways to pass such information to a tool, depending on its interface: command line arguments, "standard" configuration files, etc.

In the case of atpackager, since the latter is built as a Grunt plugin, this information will be passed as for other Grunt plugins: using a configuration object in the `Gruntfile.js` file. For more information about this file, you can have a look at [the Grunt website](http://gruntjs.com/sample-gruntfile).

The configuration is the most important topic concerning this tool, this is from what you will actually create custom packagings.





## Execute

To execute atpackager and actually build the packaging, you will need to invoke grunt with the `Gruntfile` containing the configuration as discussed [above](./configuration).

There are several ways to do this, please refer to the [Grunt website](http://gruntjs.com/getting-started) to learn about _standard_ ways. However, we quickly recap them below.

### Using the CLI program

If the Grunt CLI is globally installed (`npm install -g grunt-cli`), you can directly use it in the same folder where the `Gruntfile.js` file is: executing `grunt` will run the default task.

Note that it is still necessary to have the grunt package installed inside your project (`npm install grunt`), `grunt-cli` being only the command line interface to the former.

### Using the CLI function in Grunt directly

In our example below, we assume two things:

* the piece of JavaScript code is executed in the same folder where the `Gruntfile.js` file is
* `grunt` can be required with an absolute id (no relative path)

```javascript
var grunt = require("grunt"); // found in a node_modules folder

grunt.cli({
	gruntfile: __dirname + "/Gruntfile.js" // Gruntfile.js file in current module's folder
});
```

The list of available options can be seen in the source file [grunt/lib/grunt/cli.js at master on gruntjs/grunt repository](https://github.com/gruntjs/grunt/blob/master/lib/grunt/cli.js).

### Using Maven

The technique with Maven is to store the piece of JavaScript code shown in previous section in a file put in the same folder as the `Gruntfile.js` file, and then execute it using a specific Maven plugin.

Note that in this context, the `grunt` module might not be available as a global module, so you should adapt the path passed to `require` to point to the location where the module is actually installed (something like: `"../../../target/at-packaging/grunt"`).

Here is the sample plugin section your can tweak and add to your `pom.xml` file to achieve this:

```xml
<project>
	<build>
		<plugins>
			<plugin>
				<groupId>com.ariatemplates.attester</groupId>
				<artifactId>attester-maven-plugin</artifactId>
				<version>1.0.0</version>
				<executions>
					<execution>
						<id>at-packager</id>
						<goals>
							<goal>node</goal>
						</goals>
						<phase>compile</phase>
						<configuration>
							<arguments>
								<arg>src/build/at-packaging/build.js</arg>
								<arg>--ariatemplates-version</arg>
								<arg>${at.version}</arg>
							</arguments>
						</configuration>
					</execution>
				</executions>
			</plugin>
		</plugins>
	</build>
</project>
```

The `attester-maven-plugin` automatically downloads node.js from the maven repository and runs it with the provided arguments.

Note that more arguments can be passed in `arguments`, they will notably be available in the Grunt context by using the [`grunt.option("...")`](http://gruntjs.com/api/grunt.option) utility method.
