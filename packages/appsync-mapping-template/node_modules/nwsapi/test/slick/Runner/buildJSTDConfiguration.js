var options = require('./Helpers/RunnerOptions').parseOptions(process.argv[2]);
if (!options) return;

// Initialize
var loader = require('./Helpers/Loader');
var SpecLoader = loader.SpecLoader(require('../Configuration').Configuration, options);

SpecLoader.setEnvName('jstd');

var data = 'server: http://localhost:9876\n\n';
data += 'load:\n';

var load = function(object, base){
	for (var j = 0; j < object.length; j++)
		data += '  - "../' + (base || '') + object[j] + '.js"\n';
};

load([
	'Runner/Jasmine/jasmine',
	'Runner/JSTD-Adapter/src/JasmineAdapter',
	'Runner/Helpers/Syn',
	'Runner/Helpers/JSSpecToJasmine'
]);

SpecLoader.setSourceLoader(load).setSpecLoader(load).run();

// TODO check why JSTD Coverage fails
if (options.coverage){
	data += 'plugin:\n';
	data += '  - name: "coverage"\n';
	data += '    jar: "JSTestDriver/plugins/coverage.jar"\n';
}

var fs = require('fs');
fs.writeFile('./jsTestDriver.conf', data);