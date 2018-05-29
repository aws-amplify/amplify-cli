// Object.toQueryString from MooTools Core
jasmine.toQueryString = function(object, base){
	var queryString = [];

	for (var i in object) (function(value, key){
		if (base) key = base + '[' + key + ']';
		var result;
		if (jasmine.isArray_(value)){
			var qs = {};
			for (var j = 0; j < value.length; j++)
				qs[j] = value[j];
			result = jasmine.toQueryString(qs, key);
		} else if (typeof value == 'object'){
			result = jasmine.toQueryString(value, key);
		} else {
			result = key + '=' + encodeURIComponent(value);
		}
		
		if (value != undefined) queryString.push(result);
	})(object[i], i);

	return queryString.join('&');
};

// String.parseQueryString from MooTools More
jasmine.parseQueryString = function(string){
	var vars = string.split(/[&;]/),
		object = {};

	if (!vars.length) return object;

	for(var i = 0; i < vars.length; i++) (function(val){
		var index = val.indexOf('='),
			keys = index < 0 ? [''] : val.substr(0, index).match(/[^\]\[]+/g),
			value = decodeURIComponent(val.substr(index + 1));

		for(var j = 0; j < keys.length; j++) (function(key, i){
			var current = object[key];
			if(i < keys.length - 1)
				object = object[key] = current || {};
			else if(current != null && typeof current.length == 'number')
				current.push(value);
			else
				object[key] = current != null ? [current, value] : value;
		})(keys[j], j);

	})(vars[i]);

	return object;
};



jasmine.TrivialReporter = function(doc, appendTo) {
  this.document = doc || document;
  this.suiteDivs = {};
  this.logRunningSpecs = false;
  this.appendTo = appendTo || this.document.body;
};

jasmine.TrivialReporter.prototype.createDom = function(type, attrs, childrenVarArgs) {
  var el = document.createElement(type);

  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];

    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      if (child) {el.appendChild(child);}
    }
  }

  for (var attr in attrs) {
    if (attr == "className") {
      el[attr] = attrs[attr];
    } else {
      el.setAttribute(attr, attrs[attr]);
    }
  }

  return el;
};

jasmine.TrivialReporter.prototype.reportRunnerStarting = function(runner) {
  var showPassed, showSkipped;

  var query = jasmine.parseQueryString(document.location.search.substr(1));
  delete query.spec;
  
   this.outerDiv = this.createDom('div', {className: 'jasmine_reporter'},
      this.createDom('div', {className: 'banner'},
        this.createDom('div', {className: 'logo'},
            "Jasmine",
            this.createDom('span', {className: 'version'}, runner.env.versionString())),
        this.createDom('div', {className: 'options'},
            "Show ",
            showPassed = this.createDom('input', {id: "__jasmine_TrivialReporter_showPassed__", type: 'checkbox'}),
            this.createDom('label', {"for": "__jasmine_TrivialReporter_showPassed__"}, " passed "),
            showSkipped = this.createDom('input', {id: "__jasmine_TrivialReporter_showSkipped__", type: 'checkbox'}),
            this.createDom('label', {"for": "__jasmine_TrivialReporter_showSkipped__"}, " skipped")
            )
          ),

	  this.runnerDiv = this.createDom('div', {className: 'runner running'},
          this.createDom('a', {className: 'run_spec', href: '?' + jasmine.toQueryString(query)}, "run all"),
          this.runnerMessageSpan = this.createDom('span', {}, "Running..."),
          this.finishedAtSpan = this.createDom('span', {className: 'finished-at'}, ""))
      );

  this.appendTo.appendChild(this.outerDiv);

  var suites = runner.suites();
  for (var i = 0; i < suites.length; i++) {
    var suite = suites[i];

	query.spec = suite.getFullName();
    var suiteDiv = this.createDom('div', {className: 'suite'},
        this.createDom('a', {className: 'run_spec', href: '?' + jasmine.toQueryString(query)}, "run"),
        this.createDom('a', {className: 'description', href: '?' + jasmine.toQueryString(query)}, suite.description));
    this.suiteDivs[suite.id] = suiteDiv;
    var parentDiv = this.outerDiv;
    if (suite.parentSuite) {
      parentDiv = this.suiteDivs[suite.parentSuite.id];
    }
    parentDiv.appendChild(suiteDiv);
  }

  this.startedAt = new Date();

  var self = this;
  showPassed.onchange = function(evt) {
    if (evt.target.checked) {
      self.outerDiv.className += ' show-passed';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(/ show-passed/, '');
    }
  };

  showSkipped.onchange = function(evt) {
    if (evt.target.checked) {
      self.outerDiv.className += ' show-skipped';
    } else {
      self.outerDiv.className = self.outerDiv.className.replace(/ show-skipped/, '');
    }
  };

  runner.env.specFilter = this.specFilter;

};

jasmine.TrivialReporter.prototype.reportRunnerResults = function(runner) {
  var results = runner.results();
  var className = (results.failedCount > 0) ? "runner failed" : "runner passed";
  this.runnerDiv.setAttribute("class", className);
  //do it twice for IE
  this.runnerDiv.setAttribute("className", className);
  var specs = runner.specs();
  var specCount = 0;
  for (var i = 0; i < specs.length; i++) {
    if (this.specFilter(specs[i])) {
      specCount++;
    }
  }
  var message = "" + specCount + " spec" + (specCount == 1 ? "" : "s" ) + ", " + results.totalCount + " assertion" + (results.totalCount == 1 ? "" : "s" ) + ", " + results.failedCount + " failure" + ((results.failedCount == 1) ? "" : "s");
  message += " in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s";
  this.runnerMessageSpan.replaceChild(this.createDom('a', {className: 'description', href: '#'}, message), this.runnerMessageSpan.firstChild);

  this.finishedAtSpan.appendChild(document.createTextNode("Finished at " + new Date().toString()));
};

jasmine.TrivialReporter.prototype.reportSuiteResults = function(suite) {
  var results = suite.results();
  var status = results.passed() ? 'passed' : 'failed';
  if (results.totalCount == 0) { // todo: change this to check results.skipped
    status = 'skipped';
  }
  this.suiteDivs[suite.id].className += " " + status;
};

jasmine.TrivialReporter.prototype.reportSpecStarting = function(spec) {
  if (this.logRunningSpecs) {
    this.log('>> Jasmine Running ' + spec.suite.description + ' ' + spec.description + '...');
  }
};

jasmine.TrivialReporter.prototype.reportSpecResults = function(spec) {
  var results = spec.results();
  var status = results.passed() ? 'passed' : 'failed';
  if (results.skipped) {
    status = 'skipped';
  }

  var query = jasmine.parseQueryString(document.location.search.substr(1));
  query.spec = spec.getFullName();
  
  var specDiv = this.createDom('div', {className: 'spec '  + status},
      this.createDom('a', {className: 'run_spec', href: '?' + jasmine.toQueryString(query)}, "run"),
      this.createDom('a', {
        className: 'description',
        href: '?' + jasmine.toQueryString(query),
        title: spec.getFullName()
      }, spec.description));


  var resultItems = results.getItems();
  var messagesDiv = this.createDom('div', {className: 'messages'});
  for (var i = 0; i < resultItems.length; i++) {
    var result = resultItems[i];
    if (result.type == 'log') {
      messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage log'}, result.toString()));
    } else if (result.type == 'expect' && result.passed && !result.passed()) {
      messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage fail'}, result.message));

      var fn = spec.queue && spec.queue.blocks && spec.queue.blocks[1] ? spec.queue.blocks[1].func : null;
      if (fn){
        var pre = this.createDom('pre', {className: 'examples-code'});

        pre.appendChild(this.createDom('code', null, fn.toString().replace(/</img, '&lt;').replace(/>/img, '&gt;')));
        messagesDiv.appendChild(pre);
      }
    }
  }

  if (messagesDiv.childNodes.length > 0) {
    specDiv.appendChild(messagesDiv);
  }

  this.suiteDivs[spec.suite.id].appendChild(specDiv);
};

jasmine.TrivialReporter.prototype.log = function() {
  var console = jasmine.getGlobal().console;
  if (window.console && window.console.log){
    if (window.console.log.apply) window.console.log.apply(console, arguments);
    else window.console.log(Array.prototype.join.call(arguments, ', '));
  }
};

jasmine.TrivialReporter.prototype.getLocation = function() {
  return this.document.location;
};

(function(){

var query = jasmine.parseQueryString(document.location.search.substr(1));

jasmine.TrivialReporter.prototype.specFilter = function(spec) {
  if (!query.spec) return true;
  return spec.getFullName().indexOf(query.spec) == 0;
};

})();
