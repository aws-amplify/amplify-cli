// Copyright (c) 2005 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005 Jon Tirsen (http://www.tirsen.com)
//           (c) 2005 Michael Schuerig (http://www.schuerig.de/michael/)
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// experimental, Firefox-only
Event.simulateMouse = function(element, eventName) {
  var options = Object.extend({
    pointerX: 0,
    pointerY: 0,
    buttons: 0
  }, arguments[2] || {});
  var oEvent = document.createEvent("MouseEvents");
  oEvent.initMouseEvent(eventName, true, true, document.defaultView, 
    options.buttons, options.pointerX, options.pointerY, options.pointerX, options.pointerY, 
    false, false, false, false, 0, $(element));
  
  if(this.mark) Element.remove(this.mark);
  
  var style = 'position: absolute; width: 5px; height: 5px;' + 
    'top: #{pointerY}px; left: #{pointerX}px;'.interpolate(options) + 
    'border-top: 1px solid red; border-left: 1px solid red;'
    
  this.mark = new Element('div', { style: style });
  this.mark.appendChild(document.createTextNode(" "));
  document.body.appendChild(this.mark);
  
  if(this.step)
    alert('['+new Date().getTime().toString()+'] '+eventName+'/'+Test.Unit.inspect(options));
  
  $(element).dispatchEvent(oEvent);
};

// Note: Due to a fix in Firefox 1.0.5/6 that probably fixed "too much", this doesn't work in 1.0.6 or DP2.
// You need to downgrade to 1.0.4 for now to get this working
// See https://bugzilla.mozilla.org/show_bug.cgi?id=289940 for the fix that fixed too much
Event.simulateKey = function(element, eventName) {
  var options = Object.extend({
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    keyCode: 0,
    charCode: 0
  }, arguments[2] || {});

  var oEvent = document.createEvent("KeyEvents");
  oEvent.initKeyEvent(eventName, true, true, window, 
    options.ctrlKey, options.altKey, options.shiftKey, options.metaKey,
    options.keyCode, options.charCode );
  $(element).dispatchEvent(oEvent);
};

Event.simulateKeys = function(element, command) {
  for(var i=0; i<command.length; i++) {
    Event.simulateKey(element,'keypress',{charCode:command.charCodeAt(i)});
  }
};

var Test = {
  Unit: {
    inspect: Object.inspect // security exception workaround
  }
};

Test.Unit.Logger = Class.create({
  initialize: function(id) {
    if (typeof id === 'string')
      id = document.getElementById(id);
    this.element = id;
    if (this.element) this._createLogTable();
    this.tbody = this.element.getElementsByTagName('tbody')[0];
  },
  
  start: function(testName) {
    if (!this.element) return;
    var tr = document.createElement('tr');
    var first = document.createElement('td');
    first.appendChild(document.createTextNode(testName));
    tr.appendChild(first);
    tr.appendChild(document.createElement('td'));
    tr.appendChild(document.createElement('td'));
    this.tbody.appendChild(tr);
  },
  
  setStatus: function(status) {
    this.getLastLogLine().className = status;
    this.getLastLogLine().getElementsByTagName('td')[1].innerHTML = status;
  },
  
  finish: function(status, summary) {
    if (!this.element) return;
    this.setStatus(status);
    this.message(summary);
  },
  
  message: function(message) {
    if (!this.element) return;
    this.getMessageCell().innerHTML = this._toHTML(message);
  },
  
  summary: function(summary) {
    if (!this.element) return;
    this.element.getElementsByTagName('div')[0].innerHTML = this._toHTML(summary);
  },
  
  getLastLogLine: function() {
    var trs = this.element.getElementsByTagName('tr');
    return trs[trs.length - 1];
  },
  
  getMessageCell: function() {
    return this.getLastLogLine().getElementsByTagName('td')[2];
  },
  
  _createLogTable: function() {
    var html = '<div class="logsummary">running...</div>' +
    '<table class="logtable">' +
    '<thead><tr><th>Status</th><th>Test</th><th>Message</th></tr></thead>' +
    '<tbody class="loglines"></tbody>' +
    '</table>';
    this.element.innerHTML = html;
    
  },
  
  appendActionButtons: function(actions) {
   /* actions = $H(actions);
    if (!actions.any()) return;
    var div = new Element("div", {className: 'action_buttons'});
    actions.inject(div, function(container, action) {
      var button = new Element("input").setValue(action.key).observe("click", action.value);
      button.type = "button";
      return container.insert(button);
    });
    this.getMessageCell().insert(div); */
  },
  
  _toHTML: function(txt) {
    return txt.escapeHTML().replace(/\n/g,"<br />");
  }
});

Test.Unit.runners = [];
Test.Unit.run = true;
Test.Unit.AutoRunner = {
  run: function() {
    if (!Test.Unit.run) return;
    Test.Unit.run = false;
    for (var i=0; i < Test.Unit.runners.length; i++) {
      Test.Unit.runners[i].run();
    };
  }
};
Event.observe(window, "load", Test.Unit.AutoRunner.run);

Test.Unit.Runner = Class.create({
  initialize: function(testcases) {
    var options = this.options = Object.extend({
      testLog: 'testlog'
    }, arguments[1] || {});
    
    options.resultsURL = this.queryParams.resultsURL;
    
    this.tests = this.getTests(testcases);
    this.currentTest = 0;
    Test.Unit.runners.push(this);
  },
  
  run: function() {
    this.logger = new Test.Unit.Logger(this.options.testLog);
    this.runTests.bind(this).delay(0.1);
  },
  
  queryParams: window.location.search.parseQuery(),
  
  getTests: function(testcases) {
    var tests, options = this.options;
    if (this.queryParams.tests) tests = this.queryParams.tests.split(',');
    else if (options.tests) tests = options.tests;
    else if (options.test) tests = [option.test];
    else tests = Object.keys(testcases).grep(/^test/);
    
    return tests.map(function(test) {
      if (testcases[test])
        return new Test.Unit.Testcase(test, testcases[test], testcases.setup, testcases.teardown);
    }).compact();
  },
  
  getResult: function() {
    var results = {
      tests: this.tests.length,
      assertions: 0,
      failures: 0,
      errors: 0
    };
    
    return this.tests.inject(results, function(results, test) {
      results.assertions += test.assertions;
      results.failures   += test.failures;
      results.errors     += test.errors;
      return results;
    });
  },
  
  postResults: function() {
    if (window.postUnittestResults) {
      window.postUnittestResults(this.getResult());
    } else if (this.options.resultsURL) {
      new Ajax.Request(this.options.resultsURL, 
        { method: 'get', parameters: this.getResult(), asynchronous: false });
    }
  },
  
  runTests: function() {
    var test = this.tests[this.currentTest], actions;

    if (!test) return this.finish();
    if (!test.isWaiting) this.logger.start(test.name);
    test.run();
    if(test.isWaiting) {
      this.logger.message("Waiting for " + test.timeToWait + "ms");
      setTimeout(this.runTests.bind(this), test.timeToWait || 1000);
      return;
    }
    
    this.logger.finish(test.status(), test.summary());
    if (actions = test.actions) this.logger.appendActionButtons(actions);
    this.currentTest++;
    // tail recursive, hopefully the browser will skip the stackframe
    this.runTests();
  },
  
  finish: function() {
    this.postResults();
    this.logger.summary(this.summary());
  },
  
  summary: function() {
    return '#{tests} tests, #{assertions} assertions, #{failures} failures, #{errors} errors'
      .interpolate(this.getResult());
  }
});

Test.Unit.MessageTemplate = Class.create({
  initialize: function(string) {
    var parts = [];
    (string || '').scan(/(?=[^\\])\?|(?:\\\?|[^\?])+/, function(part) {
      parts.push(part[0]);
    });
    this.parts = parts;
  },
  
  evaluate: function(params) {
    return this.parts.map(function(part) {
      return part == '?' ? Test.Unit.inspect(params.shift()) : part.replace(/\\\?/, '?');
    }).join('');
  }
});

Test.Unit.Assertions = (function() {
  var MessageTemplate = Test.Unit.MessageTemplate;
  
  function buildMessage(message, template) {
    var args = Array.prototype.slice.call(arguments, 2);
    return (message ? message + '\n' : '') + new MessageTemplate(template).evaluate(args);
  }

  function flunk(message) {
    this.assertBlock(message || 'Flunked', function() { return false });
  }

  function assertBlock(message, block) {
    try {
      block.call(this) ? this.pass() : this.fail(message);
    } catch(e) { this.error(e) }
  }

  function assert(expression, message) {
    message = buildMessage(message || 'assert', 'got <?>', expression);
    this.assertBlock(message, function() { return expression });
  }

  function assertEqual(expected, actual, message) {
    message = buildMessage(message || 'assertEqual', 'expected: <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected == actual });
  }

  function assertNotEqual(expected, actual, message) {
    message = buildMessage(message || 'assertNotEqual', 'expected: <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected != actual });
  }

  function assertEnumEqual(expected, actual, message) {
    expected = $A(expected);
    actual = $A(actual);
    message = buildMessage(message || 'assertEnumEqual', 'expected: <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() {
      return expected.length == actual.length && expected.zip(actual).all(function(pair) { return pair[0] == pair[1] });
    });
  }

  function assertEnumNotEqual(expected, actual, message) {
    expected = $A(expected);
    actual = $A(actual);
    message = buildMessage(message || 'assertEnumNotEqual', '<?> was the same as <?>', expected, actual);
    this.assertBlock(message, function() {
      return expected.length != actual.length || expected.zip(actual).any(function(pair) { return pair[0] != pair[1] });
    });
  }
  
  function assertPairEqual(pair) {
    return pair.all(Object.isArray) ?
      pair[0].zip(pair[1]).all(assertPairEqual) : pair[0] == pair[1];
  }
  
  function assertHashEqual(expected, actual, message) {
    expected = $H(expected);
    actual = $H(actual);
    var expected_array = expected.toArray().sort(), actual_array = actual.toArray().sort();
    message = buildMessage(message || 'assertHashEqual', 'expected: <?>, actual: <?>', expected, actual);
    // from now we recursively zip & compare nested arrays
    function block() {
      return expected_array.length == actual_array.length && 
        expected_array.zip(actual_array).all(assertPairEqual);
    }
    this.assertBlock(message, block);
  }

  function assertHashNotEqual(expected, actual, message) {
    expected = $H(expected);
    actual = $H(actual);
    var expected_array = expected.toArray().sort(), actual_array = actual.toArray().sort();
    message = buildMessage(message || 'assertHashNotEqual', '<?> was the same as <?>', expected, actual);
    // from now we recursively zip & compare nested arrays
    function block() {
      return !(expected_array.length == actual_array.length && 
        expected_array.zip(actual_array).all(assertPairEqual));
    };
    this.assertBlock(message, block);
  }

  function assertIdentical(expected, actual, message) {
    message = buildMessage(message || 'assertIdentical', 'expected: <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected === actual });
  }

  function assertNotIdentical(expected, actual, message) { 
    message = buildMessage(message || 'assertNotIdentical', 'expected: <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected !== actual });
  }

  function assertNull(obj, message) {
    message = buildMessage(message || 'assertNull', 'got <?>', obj);
    this.assertBlock(message, function() { return obj === null });
  }

  function assertNotNull(obj, message) {
    message = buildMessage(message || 'assertNotNull', 'got <?>', obj);
    this.assertBlock(message, function() { return obj !== null });
  }

  function assertUndefined(obj, message) {
    message = buildMessage(message || 'assertUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return typeof obj == "undefined" });
  }

  function assertNotUndefined(obj, message) {
    message = buildMessage(message || 'assertNotUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return typeof obj != "undefined" });
  }

  function assertNullOrUndefined(obj, message) {
    message = buildMessage(message || 'assertNullOrUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return obj == null });
  }

  function assertNotNullOrUndefined(obj, message) {
    message = buildMessage(message || 'assertNotNullOrUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return obj != null });
  }

  function assertMatch(expected, actual, message) {
    message = buildMessage(message || 'assertMatch', 'regex <?> did not match <?>', expected, actual);
    this.assertBlock(message, function() { return new RegExp(expected).exec(actual) });
  }

  function assertNoMatch(expected, actual, message) {
    message = buildMessage(message || 'assertNoMatch', 'regex <?> matched <?>', expected, actual);
    this.assertBlock(message, function() { return !(new RegExp(expected).exec(actual)) });
  }

  function assertHidden(element, message) {
    message = buildMessage(message || 'assertHidden', '? isn\'t hidden.', element);
    this.assertBlock(message, function() { return element.style.display == 'none' });
  }

  function assertInstanceOf(expected, actual, message) {
    message = buildMessage(message || 'assertInstanceOf', '<?> was not an instance of the expected type', actual);
    this.assertBlock(message, function() { return actual instanceof expected });
  }

  function assertNotInstanceOf(expected, actual, message) {
    message = buildMessage(message || 'assertNotInstanceOf', '<?> was an instance of the expected type', actual);
    this.assertBlock(message, function() { return !(actual instanceof expected) });
  }

  function assertRespondsTo(method, obj, message) {
    message = buildMessage(message || 'assertRespondsTo', 'object doesn\'t respond to <?>', method);
    this.assertBlock(message, function() { return (method in obj && typeof obj[method] == 'function') });
  }

  function assertRaise(exceptionName, method, message) {
    message = buildMessage(message || 'assertRaise', '<?> exception expected but none was raised', exceptionName);
    var block = function() {
      try { 
        method();
        return false;
      } catch(e) {
        if (e.name == exceptionName) return true;
        else throw e;
      }
    };
    this.assertBlock(message, block);
  }

  function assertNothingRaised(method, message) {
    try { 
      method();
      this.assert(true, "Expected nothing to be thrown");
    } catch(e) {
      message = buildMessage(message || 'assertNothingRaised', '<?> was thrown when nothing was expected.', e);
      this.flunk(message);
    }
  }

  function isVisible(element) {
    element = $(element);
    if(!element.parentNode) return true;
    this.assertNotNull(element);
    if(element.style && Element.getStyle(element, 'display') == 'none')
      return false;
    return isVisible.call(this, element.parentNode);
  }

  function assertVisible(element, message) {
    message = buildMessage(message, '? was not visible.', element);
    this.assertBlock(message, function() { return isVisible.call(this, element) });
  }

  function assertNotVisible(element, message) {
    message = buildMessage(message, '? was not hidden and didn\'t have a hidden parent either.', element);
    this.assertBlock(message, function() { return !isVisible.call(this, element) });
  }

  function assertElementsMatch() {
    var message, pass = true, expressions = $A(arguments), elements = $A(expressions.shift());
    if (elements.length != expressions.length) {
      message = buildMessage('assertElementsMatch', 'size mismatch: ? elements, ? expressions (?).', elements.length, expressions.length, expressions);
      this.flunk(message);
      pass = false;
    }
    elements.zip(expressions).all(function(pair, index) {
      var element = $(pair.first()), expression = pair.last();
      if (element.match(expression)) return true;
      message = buildMessage('assertElementsMatch', 'In index <?>: expected <?> but got ?', index, expression, element);
      this.flunk(message);
      pass = false;
    }.bind(this))

    if (pass) this.assert(true, "Expected all elements to match.");
  }

  function assertElementMatches(element, expression, message) {
    this.assertElementsMatch([element], expression);
  }
  
  return {
    buildMessage:             buildMessage,
    flunk:                    flunk,
    assertBlock:              assertBlock,
    assert:                   assert,
    assertEqual:              assertEqual,
    assertNotEqual:           assertNotEqual,
    assertEnumEqual:          assertEnumEqual,
    assertEnumNotEqual:       assertEnumNotEqual,
    assertHashEqual:          assertHashEqual,
    assertHashNotEqual:       assertHashNotEqual,
    assertIdentical:          assertIdentical,
    assertNotIdentical:       assertNotIdentical,
    assertNull:               assertNull,
    assertNotNull:            assertNotNull,
    assertUndefined:          assertUndefined,
    assertNotUndefined:       assertNotUndefined,
    assertNullOrUndefined:    assertNullOrUndefined,
    assertNotNullOrUndefined: assertNotNullOrUndefined,
    assertMatch:              assertMatch,
    assertNoMatch:            assertNoMatch,
    assertHidden:             assertHidden,
    assertInstanceOf:         assertInstanceOf,
    assertNotInstanceOf:      assertNotInstanceOf,
    assertRespondsTo:         assertRespondsTo,
    assertRaise:              assertRaise,
    assertNothingRaised:      assertNothingRaised,
    assertVisible:            assertVisible,
    assertNotVisible:         assertNotVisible,
    assertElementsMatch:      assertElementsMatch,
    assertElementMatches:     assertElementMatches
  }
})();

Test.Unit.Testcase = Class.create(Test.Unit.Assertions, {
  initialize: function(name, test, setup, teardown) {
    this.name           = name;
    this.test           = test     || Prototype.emptyFunction;
    this.setup          = setup    || Prototype.emptyFunction;
    this.teardown       = teardown || Prototype.emptyFunction;
    this.messages       = [];
    this.actions        = {};
  },
  
  isWaiting:  false,
  timeToWait: 1000,
  assertions: 0,
  failures:   0,
  errors:     0,
  isRunningFromRake: window.location.port == 4711,
  
  wait: function(time, nextPart) {
    this.isWaiting = true;
    this.test = nextPart;
    this.timeToWait = time;
  },
  
  run: function(rethrow) {
    try {
      try {
        if (!this.isWaiting) this.setup();
        this.isWaiting = false;
        this.test();
      } finally {
        if(!this.isWaiting) {
          this.teardown();
        }
      }
    }
    catch(e) { 
      if (rethrow) throw e;
      this.error(e, this); 
    }
  },
  
  summary: function() {
    var msg = '#{assertions} assertions, #{failures} failures, #{errors} errors\n';
    return msg.interpolate(this) + this.messages.join("\n");
  },

  pass: function() {
    this.assertions++;
  },
  
  fail: function(message) {
    this.failures++;
    var line = "";
    try {
      throw new Error("stack");
    } catch(e){
      line = (/\.html:(\d+)/.exec(e.stack || '') || ['',''])[1];
    }
    this.messages.push("Failure: " + message + (line ? " Line #" + line : ""));
  },
  
  info: function(message) {
    this.messages.push("Info: " + message);
  },
  
  error: function(error, test) {
    this.errors++;
    this.actions['retry with throw'] = function() { test.run(true) };
    this.messages.push(error.name + ": "+ error.message + ", error=(" + Test.Unit.inspect(error) + ")");
  },
  
  status: function() {
    if (this.failures > 0) return 'failed';
    if (this.errors > 0) return 'error';
    return 'passed';
  },
  
  benchmark: function(operation, iterations) {
    var startAt = new Date();
    (iterations || 1).times(operation);
    var timeTaken = ((new Date())-startAt);
    this.info((arguments[2] || 'Operation') + ' finished ' + 
       iterations + ' iterations in ' + (timeTaken/1000)+'s' );
    return timeTaken;
  }
});
