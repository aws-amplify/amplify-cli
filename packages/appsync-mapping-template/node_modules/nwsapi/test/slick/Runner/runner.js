#!/usr/bin/env node
// Runs Specs in NodeJS

var puts = require('sys').puts;


var options = require('./Helpers/RunnerOptions').parseOptions(process.argv[2]);
if (!options) return;

// Initialize
var loader = require('./Helpers/Loader');
var SpecLoader = loader.SpecLoader(require('../Configuration').Configuration, options);

SpecLoader.setEnvName('nodejs');

// set method to require all the sourcefiles and append the objects to this object
var self = this;
var append = function(original){
	for (var i = 1, l = arguments.length; i < l; i++){
		var extended = arguments[i] || {};
		for (var key in extended) original[key] = extended[key];
	}
	return original;
};

SpecLoader.setSourceLoader(function(object, base){
	for (var j = 0; j < object.length; j++){
		if (object[j] == 'Slick/Slick.Parser'){
			Slick = require('../' + (base || '') + object[j]).Slick;
			append(self, Slick);
		} else {
			append(self, require('../' + (base || '') + object[j]));
		}
		
	}
});


// Set method to get all the spec files
var specs = [];
SpecLoader.setSpecLoader(function(object, base){
	for (var j = 0; j < object.length; j++)
		specs.push(__dirname + '/../' + (base || '') + object[j]);
});


// Run loader
SpecLoader.run();


// Fire jasmine
require.paths.push('./Jasmine-Node/lib');

var jasmine = require('jasmine'),
	sys = require('sys');

for(var key in jasmine)
  global[key] = jasmine[key];

require('./Helpers/JSSpecToJasmine');

var reporter = require('reporters/' + (options.reporter || 'console')).Reporter;
reporter.done = function(runner, log){
  process.exit(runner.results().failedCount);
};

jasmine.runSpecs(specs, reporter);
