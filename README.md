atpackager
==========

[![Build Status](https://secure.travis-ci.org/ariatemplates/atpackager.png?branch=master)](http://travis-ci.org/ariatemplates/atpackager)

atpackager is a [Grunt](http://gruntjs.com) plugin to create a set of packages from a set of input files,
doing transformations in the middle.

It is developed primarily to package the [Aria Templates framework](http://ariatemplates.com/) itself, and applications
built with Aria Templates. However, it can also be used as a build tool independently of Aria Templates.

It is based on the principle of visitors, allowing to easily add custom transformations to files.
