// Put this file in the parent directory of the runner folder. Also rename the file to Configuration.js

(function(context){

var Configuration = context.Configuration = {};

// Runner name
Configuration.name = 'MooTools More';


// Presets - combine the sets and the source to a preset to easily run a test
Configuration.presets = {
	
	'more-all': {
		sets: ['1.3-all'],
		source: ['core-1.3-base', 'core-1.3-client']
	}
	
};

// An object with default presets
Configuration.defaultPresets = {
	browser: 'more-all',
	nodejs: 'more-base',
	jstd: 'more-all'
};


/*
 * An object with sets. Each item in the object should have an path key, 
 * that specifies where the spec files are and an array with all the files
 * without the .js extension relative to the given path
 */
Configuration.sets = {

	'1.3-all': {
		path: '1.3/',
		files: ['Core/Lang', 'Core/Log']
	}

};


/*
 * An object with the source files. Each item should have an path key,
 * that specifies where the source files are and an array with all the files
 * without the .js extension relative to the given path
 */
Configuration.source = {

	'core-1.3-base': {
		path: 'mootools-core/Source/',
		files: [
			'Core/Core',

			'Types/Array',
			'Types/Function',
			'Types/Number'
		]
	},
	'core-1.3-client': {
		path: 'mootools-core/Source/',
		files: [
			'Types/Event',
			'Browser/Browser'
		]
	}

};

})(typeof exports != 'undefined' ? exports : this);
