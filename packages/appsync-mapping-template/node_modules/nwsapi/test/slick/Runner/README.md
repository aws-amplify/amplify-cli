MooTools Core Specs
===================

This repository is intended to provide the specification infrastructure for MooTools Core.

The infrastructure uses Jasmine as a UnitTest-Library. It is possible to run Specs via
the browser, via JSTestDriver and via NodeJS.

### Setup

Clone the MooTools Core repository and initialize the submodules.

Set up the Specs:

	cd Specs
	git pull origin master
	git submodule update --init
	chmod +x server test runner runner.js buildCommonJS buildJSTDConfiguration

### Requirements

* NodeJS
* PHP (for Packager)

### Usage

* Open index.html in your favorite browser and press the right link
* Run the JSTD Server
	* Start via ./server {options}
	* Point one or more browsers to http://localhost:9876
	* Run all tests via ./test
* Run in NodeJS via ./runner.js {options}

### Available Options

Options are specified via JSON.

Example for JSTD
	./server '{"version": 1.3, "path": "../core/", "specs": [1.2, "1.3base", "1.3client"]}'

Example for NodeJS
	./runner.js '{"sets": ["1.3base"], "source": "../core/"}'

Options
	"sets" - The specs to run, see Configuration.js
	"source" - The source files package, see Configuration.js
	"preset" - You can simply use a preset with predefined sets and source, see Configuration.js