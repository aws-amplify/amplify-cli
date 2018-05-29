/*
 * NWSAPI Benchmark tool using benchmark.js
 */
(function(Benchmark, document, default_presets) {

	// selector engines
	var engines = {
		'qsa':
				'd.querySelectorAll(s)',

		'nwsapi':
				'NW.Dom.select(s, d)',

		'nwmatcher':
				'NW.Dom.select(s, d)'
	},

	// Used to indicate whether console profiling is begin run
	profiling,
	trim,

	// Class manipulation
	// IE doesn't match non-breaking spaces with \s
	rtrim = /\S/.test("\xA0") ? (/^[\s\xA0]+|[\s\xA0]+$/g) : /^\s+|\s+$/g,
	ptrim = String.prototype.trim,

	// scores & results
	scores = { },
	returned = { },

	// selectors list
    selectors = [ ],

	// build URL params
	useQSA = false,
    urlParams = { },

	// benchmark options
	maxTime = 0.5,
	minSamples = 3,

	// test HTML file name
	testHtml = 'selectors',

	// default selectors set
	defaultSet = 'default',

	// keeps track of all errors
	errors = { },

	// keeps track of all iframes
	iframes = { },

	// the number of tested engines
	numEngines = 0,

	// starting selector in the set
	selectorIndex = 0,

    // paused test execution
	paused_execution = false;

	// expose iframeCallbacks
	window.iframeCallbacks = { };

    /**
	 * Set env vars before next test run
	 */
	function reset_env() {

		errors = { };
		iframes = { };

		scores = { };
		returned = { };

		scores = set_scores();
		returned = set_returned();
		urlParams = set_urlParams();
		numEngines = set_numEngines();

		window.iframeCallbacks = { };

		get('message').innerHTML = '';

		// allow engines to use QSA
		useQSA = urlParams.qsa || false;
	}

    /**
	 * Construct search parameters object
	 */
	function set_urlParams() {
		var parts, value,
			params = {},
			search = location.search.substring(1).split('&'),
			i = 0,
			len = search.length;

		for (; len > i; ++i) {
			parts = search[i].split('=');
			value = parts[1];
			// Cast booleans and treat no value as true
			params[decodeURIComponent(parts[0])] =
				value && value !== 'true' ?
					value === 'false' ? false :
					decodeURIComponent(value) :
				true;
		}

		return params;
	}

	/**
	 * Keeps track of overall scores
	 */
	function set_scores() {
		var engine,
			scores = {};
		for (engine in engines) {
			scores[engine] = 0;
		}
		return scores;
	}

	/**
	 * number of elements returned
	 */
	function set_returned() {
		var engine, returned = {};
		for (engine in engines) {
			returned[engine] = {};
		}
		return returned;
	}

	/**
	 * counts the available engines
	 */
	function set_numEngines() {
		var engine, count = 0;
		for (engine in engines) {
			count++;
		}
		return count;
	}

	/**
	 * Trim leading and trailing whitespace
	 *
	 * @private
	 * @param {String} str The string to trim
	 */
	trim = ptrim ?
		function(str) {
			return ptrim.call(str);
		} :
		function(str) {
			return str.replace(rtrim, '');
		};

	/**
	 * A shortcut for getElementById
	 *
	 * @private
	 * @param {String} id The ID with which to query the DOM
	 */
	function get(id) {
		return document.getElementById(id);
	}

	/**
	 * Adds the given class to the element if it does not exist
	 *
	 * @private
	 * @param {Element} elem The element on which to add the class
	 * @param {String} classStr The class to add
	 */
	function addClass(elem, classStr) {
		classStr = classStr.split(/\s+/);
		var i = 0, c, cls, len = classStr.length;
		cls = ' ' + elem.className + ' ';
		for (; len > i ; ++i) {
			c = classStr[i];
			if (c && cls.indexOf(' ' + c + ' ') < 0) {
				cls += c + ' ';
			}
		}
		elem.className = trim(cls);
	}

	/**
	 * Removes a given class on the element
	 *
	 * @private
	 * @param {Element} elem The element from which to remove the class
	 * @param {String} classStr The class to remove
	 */
	function removeClass(elem, classStr) {
		var cls, len, i;

		if (classStr !== undefined) {
			classStr = classStr.split(/\s+/);
			cls = ' ' + elem.className + ' ';
			i = 0;
			len = classStr.length;
			for (; len > i ; ++i) {
				cls = cls.replace(' ' + classStr[i] + ' ', ' ');
			}
			cls = trim(cls);
		} else {
			// Remove all classes
			cls = '';
		}

		if (elem.className !== cls) {
			elem.className = cls;
		}
	}

	/**
	 * Runs the console profiler if available
	 *
	 * @param {String} name The name of the profile
	 */
	function profile(name) {
		if (window.console && typeof console.profile !== 'undefined' && !profiling) {
			profiling = true;
			console.profile(name);
		}
	}

	/**
	 * Stops console profiling if available
	 *
	 * @param {String} name The name of the profile
	 */
	function profileEnd(name) {
		if (profiling) {
			profiling = false;
			console.profileEnd(name);
		}
	}

	/**
	 * Retrieves the position of the first column
	 *  of the row that has just been tested
	 */
	function firstTestedColumn() {
		return selectorIndex * (numEngines + 1) + 1;
	}

	/**
	 * Add random number to the url to stop caching
	 *
	 * @private
	 * @param {String} value The url to which to add cache control
	 * @returns {String} Returns the new url
	 *
	 * @example url('data/test.html')
	 * // => 'data/test.html?10538358428943'
	 *
	 * @example url('data/test.php?foo=bar')
	 * // => 'data/test.php?foo=bar&10538358345554'
	 */
	function url(value) {
		return value + (/\?/.test(value) ? '&' : '?') + new Date().getTime() + '' + parseInt(Math.random() * 100000, 10);
	}

	/**
	 * Gets the Hz, i.e. operations per second, of `bench` adjusted for the
	 *  margin of error.
	 *
	 * @private
	 * @param {Object} bench The benchmark object.
	 * @returns {Number} Returns the adjusted Hz.
	 */
	function getHz(bench) {
		return 1 / (bench.stats.mean + bench.stats.moe);
	}

	/**
	 * Determines the common number of elements found by the engines.
	 *   If there are only 2 engines, this will just return the first one.
	 *
	 * @private
	 * @param {String} selector The selector for which to check returned elements
	 */
	function getCommonReturn(selector) {
		var engine, count, common, max = 0, counts = {};

		for (engine in returned) {
			count = returned[engine][selector];
			if (count) {
				count = count.length;
				counts[count] = (counts[count] || 0) + 1;
			}
		}

		for (count in counts) {
			if (counts[count] > max) {
				max = counts[count];
				common = count;
			}
		}

		return +common;
	}

	/**
	 * Adds all of the necessary headers
	 * and rows for all selector engines
	 *
	 * @private
	 */
	function buildResultsTable(selectors) {
		var i = 0, engine, len = selectors.length,
		head = '<th class="small selector">selectors</th>',
		emptyColumns = '', rows = '';

		// Build output headers
		for (engine in engines) {
			head += '<th class="text-right">' + engine.match(/^[^\/]+/)[0] + '</th>';
			emptyColumns += '<td class="text-right" data-engine="' + engine + '">&nbsp;</td>';
		}

		// Build out initial rows
		for (; len > i ; ++i) {
			rows += '<tr><td id="selector' + i + '" class="small selector"><span>' +
				selectors[i] + '</span></td>' + emptyColumns + '</tr>';
		}
		rows += '<tr><td id="results" class="bold">Total op/s (higher is better)</td>' +
			emptyColumns + '</tr>';

		get('perf-head').innerHTML = head;
		get('perf-body').innerHTML = rows;
	}

	/**
	 * Creates an iframe for use in testing a selector engine
	 *
	 * @private
	 * @param {String} engine Indicates which selector engine to load in the fixture
	 * @param {String} suite Name of the Benchmark Suite to use
	 * @param {Number} callbackIndex Index of the iframe callback for this iframe
	 * @returns {Element} Returns the iframe
	 */
	function createIframe(engine, suite, callbackIndex) {
		var src = url('./example/' + testHtml + '.html?engine=' + encodeURIComponent(engine) +
				'&suite=' + encodeURIComponent(suite) +
				'&callback=' + callbackIndex +
				'&qsa=' + useQSA),
			iframe = document.createElement('iframe');
		iframe.setAttribute('src', src);
		iframe.style.cssText = 'width: 500px; height: 500px; position: absolute; ' +
			'top: -600px; left: -600px; visibility: hidden;';
		document.body.appendChild(iframe);
		iframes[suite].push(iframe);
		return iframe;
	}

	/**
	 * Runs a Benchmark suite from within an iframe then destroys the iframe
	 * Each selector is tested in a fresh iframe
	 *
	 * @private
	 * @param {Object} suite Benchmark Suite to which to add tests
	 * @param {String} selector The selector being tested
	 * @param {String} engine The selector engine begin tested
	 * @param {Function} iframeLoaded Callback to call when the iframe has loaded
	 */
	function addTestToSuite(suite, selector, engine, iframeLoaded) {

		/**
		 * Run selector tests with a particular engine in an iframe
		 *
		 * @param {Function} r Require in the context of the iframe
		 * @param {Object} document The document of the iframe
		 */
		function test(document) {
			var win = this,
				select = new Function(
					'w', 's', 'd',
					'return ' + (engine !== 'qsa' ? 'w.' : '') + 
					engines[engine]);
			suite.add(engine, function() {
				returned[engine][selector] = select(win, selector, document);
			});
			if (typeof iframeLoaded !== 'undefined') {
				iframeLoaded();
			}
		}

		// Called by the iframe
		var index, name = suite.name,
		callbacks = window.iframeCallbacks[name];

		index = callbacks.push(function() {
			var self = this, args = arguments;
			setTimeout(function() {
				test.apply(self, args);
			}, 0);
		}) - 1;

		// Load fixture in iframe and add it to the list
		createIframe(engine, name, index);
	}

	/**
	 * Tests a selector in all selector engines
	 *
	 * @private
	 * @param {String} selector Selector to test
	 */
	function testSelector(selector) {
		var engine,
		suite = Benchmark.Suite(selector),
		name = suite.name, count = numEngines;

		/**
		 * Called when an iframe has loaded for a test.
		 *   Need to wait until all iframes
		 *   have loaded to run the suite
		 */
		function loaded() {
			--count;
			// Run the suite
			if (count === 0) {
				suite.run();
			}
		}

		// Add spots for iframe callbacks and iframes
		window.iframeCallbacks[name] = [];
		iframes[name] = [];

		// Add the tests to the new suite
		for (engine in engines) {
			addTestToSuite(suite, selector, engine, loaded);
		}
	}

	/**
	 * Adds the bench to the list of failures to indicate
	 *   failure on cycle. Aborts and returns false.
	 *
	 * @param {Object} event Benchmark.Event instance
	 */
	function onError() {
		errors[this.id] = true;
		this.abort();
		return false;
	}

	/**
	 * Callback for the start of each test
	 * Adds the `pending` class to the selector column
	 */
	function onStart() {
		profile(selectors[selectorIndex]);
		var selectorElem = get('selector' + selectorIndex);
		addClass(selectorElem, 'pending');
	}

	/**
	 * Adds the Hz result or 'FAILURE' to the corresponding column for the engine
	 */
	function onCycle(event) {
		var i = firstTestedColumn(),
		len = i + numEngines,
		tableBody = get('perf-body'),
		tds = tableBody.getElementsByTagName('td'),
		bench = event.target, hasError = errors[bench.id],
		score =
			hasError ?
				'FAILED' : (paused_execution ? '' :
				Benchmark.formatNumber(getHz(bench).toFixed(2)) + ' op/s | ' +
					('     ' + returned[bench.name][selectors[selectorIndex]].length).slice(-4) +
					' found');

		// Add the result to the row
		for (; len > i ; ++i) {
			if (tds[i].getAttribute('data-engine') === bench.name) {
				tds[i].innerHTML = '<pre>' + score + '</pre>';
				if (hasError) {
					addClass(tds[i], 'black');
				}
				break;
			}
		}
	}

	/**
	 * Called after each test
	 *   - Removes the `pending` class from the row
	 *   - Adds the totals to the `scores` object
	 *   - Highlights the corresponding row appropriately
	 *   - Removes all iframes and their callbacks from memory
	 *   - Calls the next test OR finishes up by:
	 *     * adding the `complete` class to body
	 *     * adding the totals to the table
	 *     * determining the fastest overall and slowest overall
	 */
	function onComplete() {
		profileEnd(selectors[selectorIndex]);
		var fastestHz, slowestHz, elem, attr, j, jlen, td, ret,
			i = firstTestedColumn(),
			// Determine different elements returned
			selector = selectors[selectorIndex],
			common = getCommonReturn(selector),
			len = i + numEngines,
			selectorElem = get('selector' + selectorIndex),
			tableBody = get('perf-body'),
			tds = tableBody.getElementsByTagName('td'),
			fastest = this.filter('fastest'),
			slowest = this.filter('slowest');

		removeClass(selectorElem, 'pending');

		// Add up the scores
		this.forEach(function(bench) {
			if (errors[bench.id]) {
				// No need to store this error anymore
				delete errors[bench.id];
			} else {
				scores[bench.name] += getHz(bench);
			}
		});

		// Highlight different returned yellow, fastest green, and slowest red
		for (; len > i ; ++i) {
			td = tds[i];
			attr = td.getAttribute('data-engine');
			ret = returned[attr][selector];
			if (ret && ret.length !== common) {
				addClass(td, 'yellow');
				continue;
			}
			for (j = 0, jlen = slowest.length; jlen > j ; ++j) {
				if (slowest[j].name === attr) {
					addClass(td, 'red');
				}
			}
			for (j = 0, jlen = fastest.length; jlen > j ; ++j) {
				if (fastest[j].name === attr) {
					addClass(td, 'green');
				}
			}
		}

		// Remove all added iframes for this suite
		for (i = 0, len = iframes[this.name].length; len > i ; ++i) {
			document.body.removeChild(iframes[this.name].pop());
		}
		delete iframes[this.name];

		// Remove all callbacks on the window for this suite
		window.iframeCallbacks[this.name] = null;
		try {
			// Errors in IE
			delete window.iframeCallbacks[this.name];
		} catch (e) {}

		// next selector
		++selectorIndex;

		if (!paused_execution && selectorIndex < selectors.length) {

			// execute next selector testing
			testSelector(selectors[selectorIndex]);

		} else if (!paused_execution) {

			addClass(document.body, 'complete');

			// Get the fastest and slowest
			slowest = fastest = undefined;
			fastestHz = 0;
			slowestHz = Infinity;
			for (i in scores) {
				if (scores[i] > fastestHz) {
					fastestHz = scores[i];
					fastest = i;
				} else if (scores[i] < slowestHz) {
					slowestHz = scores[i];
					slowest = i;
				}
				// Format scores for display
				scores[i] = Benchmark.formatNumber(scores[i].toFixed(2)) + 'o/s';
			}

			// Add result message to the header
			elem = document.createElement('h3');
			elem.innerHTML = 'The fastest is <i>' + fastest + ' (' +
				scores[fastest] + ')</i>. ' +
				'The slowest is <i>' + slowest + ' (' +
				scores[slowest] + ')</i>.';
			get('message').innerHTML = '';
			get('message').appendChild(elem);

			// Add totals to table
			i = firstTestedColumn();
			while ((elem = tds[i])) {
				attr = elem.getAttribute('data-engine');
				if (attr === fastest) {
					addClass(elem, 'green');
				} else if (attr === slowest) {
					addClass(elem, 'red');
				} else {
					addClass(elem, 'red');
				}
				++i;
				elem.appendChild(document.createTextNode(scores[attr]));
			}
		}
	}

	/* Benchmark Options
	---------------------------------------------------------------------- */

	Benchmark.options.async = true;
	Benchmark.options.maxTime = maxTime;
	Benchmark.options.minSamples = minSamples;
	Benchmark.options.onError = onError;

	/* Benchmark Suite Options
	---------------------------------------------------------------------- */
	Benchmark.Suite.options.onStart = onStart;
	Benchmark.Suite.options.onCycle = onCycle;
	Benchmark.Suite.options.onComplete = onComplete;

	/* allows testing multiple presets list of selectors
	---------------------------------------------------------------------- */

	function changedSet(selected_set, idx) {
		// is this a paused execution ?
		if (paused_execution) {
			// yes, cancel it before starting new test
			paused_execution = false;
		}
		// select the requested set
//		selectors = selected_set;
		// reset the index
		selectorIndex = 0;
		// finally run it
		start_test();
	}

	var selected, start_button, stop_button, sets = default_presets,

	init = function() {
		var item, select = document.getElementById('presets');

		for(item in sets) {
			select.add(new Option(item.replace(/_/g, ' ')));
		}

		select.addEventListener('change', function(event) {
			selected = this.value;
			selectors = sets[selected.replace(/ /g, '_')];
			changedSet(selectors, selectorIndex);
		}, true);

		// test using the 'default' set
		start_test();
	},

	start_test = function() {

		// was it a paused execution ?
		if (paused_execution) {
			// yes, resume the paused run
			paused_execution = false;
			// repeat last iteration
			--selectorIndex;
		} else {
			// fresh test run of a new set
			// reset counters & vars
			reset_env();
			// start from first selector in the set
			selectorIndex = 0;
			// rebuild results table based on the new set
			buildResultsTable(selectors);
		}
		// execute next selector test
		testSelector(selectors[selectorIndex]);
	},

	stop_test = function() {
		paused_execution = true;
		//window.stop();
	};

	start_button = document.getElementById('start');
	start_button.addEventListener('click', start_test, false);

	stop_button = document.getElementById('stop');
	stop_button.addEventListener('click', stop_test, false);

	// 'default' preset group
	selectors = sets['default'];

	init();

})(Benchmark, document, default_presets);
