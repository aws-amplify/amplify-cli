(function(context){

var toString = Object.prototype.toString;
var isArray = Array.isArray || function(array){
	return toString.call(array) == '[object Array]';
};

var indexOf = function(array, item, from){
	var len = array.length;
	for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
		if (array[i] === item) return i;
	}
	return -1;
};

var forEach = function(array, fn, bind){
	for (var i = 0, l = array.length; i < l; i++){
		if (i in array) fn.call(bind, array[i], i, array);
	}
};


context.SpecLoader = function(config, options){

	// initialization
	var preset;
	if (options.preset) preset = config.presets[options.preset];

	var setNames = [],
		sourceNames = [],
		sourceLoader = function(){},
		specLoader = function(){},
		envName = 'browser';

	
	// private methods
	
	var getDefault = function(){
		return config.presets[config.defaultPresets[envName]];
	};
	
	var getSets = function(){
		var requestedSets = [],
			sets = (preset || options).sets || getDefault().sets;
	
		forEach(sets && isArray(sets) ? sets : [sets], function(set){
			if (config.sets[set] && indexOf(requestedSets, set) == -1) requestedSets.push(set);
		});
	
		return requestedSets;			
	};
		
	var getSource = function(){
		var requestedSource = [],
			source = (preset || options).source || getDefault().source;
		
		forEach(source && isArray(source) ? source : [source], function(src){
			if (config.source[src] && indexOf(requestedSource, src) == -1) requestedSource.push(src);
		});
	
		return requestedSource;			
	};
	
	var loadSets = function(){
		forEach(setNames, function(set){
			specLoader(config.sets[set].files, config.sets[set].path);
		});
	};
		
	var loadSource = function(){
		forEach(sourceNames, function(set){
			sourceLoader(config.source[set].files, config.source[set].path);
		});
	};

	// public methods
	
	return {

		setSourceLoader: function(loader){
			sourceLoader = loader;
			return this;
		},
		
		setSpecLoader: function(load){
			specLoader = load;
			return this;
		},
		
		setEnvName: function(name){
			envName = name;
			return this;
		},

		run: function(){
			
			// Get the sets and source
			setNames = getSets();		
			sourceNames = getSource();
			
			// Load the sets and source
			loadSource();
			loadSets();
			
			return this;
		},
		
		getSetNames: function(){
			return setNames;
		},

		getSourceNames: function(){
			return sourceNames;
		}
		
	};
	
};


})(typeof exports != 'undefined' ? exports : this);
