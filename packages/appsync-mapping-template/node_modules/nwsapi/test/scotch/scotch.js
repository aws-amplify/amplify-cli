/*! Scotch JavaScript unit testing library, version 1.0.0_rc3
* (c) 2010 Kit Goncharov (http://kitgoncharov.github.com)
*
* Freely distributable under the MIT License.
* Details and documentation: http://kitgoncharov.github.com/scotch.
*
* Built: 22 luglio 2010 1.11.42 CEST
* ----------------------------------------------------------------------------*/

(function(global){
  var getClass = Object.prototype.toString, cleanWhitespace = String.prototype.trim || function(){
    return (this + "").replace(/^\s\s*/, "").replace(/\s\s*$/, "");
  }, toArray = Array.prototype.slice, document, previousScotch = global.Scotch;
  function isHostType(object, property){
    var type = typeof object[property];
    return type === "object" ? !!object[property] : type !== "boolean" && type !== "number" && type !== "string" && type !== "undefined";
  }
  function inspect(object, depth){
    var results, index, length, nodeName, nodeValue;
    (depth || (depth = 0));
    try{
      if(object == null){
        return object + "";
      }
      switch(getClass.call(object)){
        case "[object Boolean]":
        case "[object Number]":
        case "[object RegExp]":
        return object + "";
        case "[object Date]":
        return "{" + (+object) + "}";
        case "[object String]":
        return '"' + object.replace(/"/g, "'").replace(/[\s\xA0]+/g, " ") + '"';
        case "[object Array]":
        if((length = object.length) === 0){
          return "[]";
        }
        results = [];
        index = 0;
        for(; index < length; index++){
          results[results.length] = inspect(object[index], ++depth);
          if(depth > 20 && (results[results.length] = "...")){
            break;
          }
        }
        return "[" + results.join(", ") + "]";
        case "[object Function]":
        return "function " + (object.displayName || object.name || "anonymous") + "(){...}";
        default:
        if("nodeName" in object && "nodeValue" in object && "nodeType" in object){
          nodeName = object.nodeName.toLowerCase();
          nodeValue = object.nodeValue;
          switch(object.nodeType){
            case 1:
            switch(nodeName){
              case "a":
              if(object.name){
                nodeName += ' name="' + object.name + '"';
              }
              if(object.href){
                nodeName += ' href="' + object.href + '"';
              }
              break;
              case "img":
              case "iframe":
              if(object.src){
                nodeName += ' src="' + object.src + '"';
              }
              break;
              case "input":
              if(object.name){
                nodeName += ' name="' + object.name + '"';
              }
              if(object.type){
                nodeName += ' type="' + object.type + '"';
              }
              break;
              case "form":
              if(object.action){
                nodeName += ' action="' + object.action + '"';
              }
              break;
            }
            if(object.id){
              nodeName += ' id="' + object.id + '"';
            }
            if(object.className){
              nodeName += ' class="' + object.className + '"';
            }
            return "<" + nodeName + ">";
            case 3:
            return (!nodeValue || (/^[\s\xA0]+$/).test(nodeValue)) ? "(whitespace)" : '"' + nodeValue + '"';
            case 8:
            return "<!--" + nodeValue + "-->";
            case 9:
            return "Document";
            case 10:
            return "<!DOCTYPE>";
            default:
            return nodeName;
          }
        }
        if("name" in object && "message" in object){
          return object.message + " (" + object.name + ")";
        }
        results = [];
        for(index in object){
          results[results.length] = index + ": " + inspect(object[index], ++depth);
          if(depth > 10 && (results[results.length] = "...")){
            break;
          }
        }
        return "{" + results.join(", ") + "}";
      }
    }catch(exception){}
    return object + "";
  }
  function sprintf(string){
    var pattern = /%?%[a-zA-Z]/;
    sprintf = function(string){
      var result, index, match, argument, substitution;
      string = string + "";
      if(arguments.length < 2 || string.indexOf("%") === -1){
        return string;
      }
      result = "";
      index = 1;
      while((match = pattern.exec(string))){
        result += string.slice(0, match.index);
        if((argument = match[0]).indexOf("%%") === 0){
          result += argument.slice(1);
        }else{
          if(index in arguments){
            substitution = arguments[index];
            switch(argument){
              case "%i":
              case "%d":
              result += ~~substitution || 0;
              break;
              case "%f":
              result += +substitution || 0;
              break;
              case "%o":
              result += inspect(substitution);
              break;
              default:
              result += substitution;
              break;
            }
          }else{
            result += argument;
          }
          index++;
        }
        string = string.slice(match.index + argument.length);
      }
      return cleanWhitespace.call(result + string);
    };
    return sprintf.apply(null, arguments);
  }
  function scotch(name, options){
    return new scotch.Runner(name, options);
  }
  scotch.version = "1.0.0_rc3";
  scotch.runners = [];
  scotch.run = function(){
    var runners = scotch.runners, index = 0, length = runners.length;
    for(; index < length; index++){
      runners[index].run();
    }
    return runners;
  };
  document = isHostType(global, "document") && global.document;
  scotch.assertions = (function(){
    function assert(expression, message){
      return expression ? this.addAssertion() : this.addFailure("`assert`: Expression: %o, Message: %s.", expression, message ? sprintf(message, toArray.call(arguments, 2)) : "expression == false");
    }
    function refute(expression, message){
      return expression ? this.addFailure("`refute`: Expression: %o, Message: %s.", expression, message ? sprintf(message, toArray.call(arguments, 2)) : "expression == true") : this.addAssertion();
    }
    function assertLike(expected, actual, message){
      return expected == actual ? this.addAssertion() : this.addFailure("`assertLike`: Expected: %o, Actual: %o, Message: %s.", expected, actual, message ? sprintf(message, toArray.call(arguments, 2)) : "expected != actual");
    }
    function refuteLike(expected, actual, message){
      return expected != actual ? this.addAssertion() : this.addFailure("`refuteLike`: Expected: %o, Actual: %o, Message: %s.", expected, actual, message ? sprintf(message, toArray.call(arguments, 3)) : "expected == actual");
    }
    function assertEqual(expected, actual, message){
      return expected === actual ? this.addAssertion() : this.addFailure("`assertEqual`: Expected: %o, Actual: %o, Message: %s.", expected, actual, message ? sprintf(message, toArray.call(arguments, 3)) : "expected !== actual");
    }
    function refuteEqual(expected, actual, message){
      return expected !== actual ? this.addAssertion() : this.addFailure("`refuteEqual`: Expected: %o, Actual: %o, Message: %s.", expected, actual, message ? sprintf(message, toArray.call(arguments, 3)) : "expected === actual");
    }
    function size(object){
      var count = 0, property;
      for(property in object){
        count++;
      }
      return count;
    }
    function equivalent(expected, actual){
      var index, length;
      if(expected === actual){
        return true;
      }
      if(expected === null){
        return actual === null;
      }
      if(typeof expected === "undefined"){
        return typeof actual === "undefined";
      }
      switch(getClass.call(expected)){
        case "[object Function]":
        return expected === actual;
        case "[object String]":
        case "[object Boolean]":
        return expected.valueOf() === actual.valueOf();
        case "[object Number]":
        return isNaN(expected) ? isNaN(actual) : expected.valueOf() === actual.valueOf();
        case "[object Date]":
        return getClass.call(actual) === "[object Date]" && +expected === +actual;
        case "[object RegExp]":
        return getClass.call(actual) === "[object RegExp]" && expected.source === actual.source && expected.global === actual.global && expected.ignoreCase === actual.ignoreCase && expected.multiline === actual.multiline && expected.sticky === actual.sticky;
        case "[object Array]":
        if(getClass.call(actual) !== "[object Array]" || (length = expected.length) !== actual.length){
          return false;
        }
        for(index = 0; index < length; index++){
          if(!equivalent(expected[index], actual[index])){
            return false;
          }
        }
        return true;
        default:
        if(size(expected) !== size(actual)){
          return false;
        }
        for(index in expected){
          if(!(index in actual) || !equivalent(expected[index], actual[index])){
            return false;
          }
        }
        return true;
      }
      return false;
    }
    function assertEquivalent(expected, actual, message){
      return equivalent(expected, actual) ? this.addAssertion() : this.addFailure("`assertEquivalent`: Expected: %o, Actual: %o, Message: %s.", expected, actual, message ? sprintf(message, toArray.call(arguments, 3)) : "The two objects are not equivalent");
    }
    function refuteEquivalent(expected, actual, message){
      return equivalent(expected, actual) ? this.addFailure("`refuteEquivalent`: Expected: %o, Actual: %o, Message: %s.", expected, actual, message ? sprintf(message, toArray.call(arguments, 3)) : "The two objects are equivalent") : this.addAssertion();
    }
    function assertThrowsException(expected, callback, message) {
      var isRegExp = expected && getClass.call(expected) == '[object RegExp]', isFunction = !isRegExp && typeof expected == 'function';
      try {
        callback();
        return this.addFailure("`assertThrowsException`: Function: %o, Message: %s.", method, message ? sprintf(message, toArray.call(arguments, 3)) : "The function did not throw any exceptions");
      } catch (exception) {
        return ((isRegExp && (expected.test(exception) || expected.test(exception.message))) || (isFunction && expected.call(this, exception, this))) ? this.addAssertion() : this.addError(exception);
      }
    }
    function assertThrowsNothing(method, message){
      try{
        method.call(global);
        return this.addAssertion();
      }catch(exception){
        return this.addFailure("`assertThrowsNothing`: Function: %o, Exception: %o, Message: %s.", method, exception, message ? sprintf(message, toArray.call(arguments, 2)) : "The function threw an exception");
      }
    }
    return {
      "assert": assert,
      "refute": refute,
      "assertLike": assertLike,
      "refuteLike": refuteLike,
      "assertEqual": assertEqual,
      "refuteEqual": refuteEqual,
      "assertEquivalent": assertEquivalent,
      "refuteEquivalent": refuteEquivalent,
      "assertThrowsException": assertThrowsException,
      "assertThrowsNothing": assertThrowsNothing
    };
  }());
  scotch.Case = (function(){
    var Prototype;
    function Case(name, test, setup, teardown){
      this.name = name;
      this.test = test;
      this.setup = setup;
      this.teardown = teardown;
      this.assertions = 0;
      this.failures = 0;
      this.errors = 0;
      this.warnings = 0;
      this.paused = false;
      this.timeout = Case.defaultTimeout;
      this.messages = [];
    }
    Case.defaultTimeout = 3000;
    Case.PASSED = 1;
    Case.WARNING = 2;
    Case.FAILED = 3;
    Case.CRITICAL = 4;
    function Mixin(){}
    Mixin.prototype = scotch.assertions;
    Prototype = Case.prototype = new Mixin();
    Mixin = null;
    Prototype.constructor = Case;
    function run(){
      try{
        if(!this.paused && this.setup){
          this.setup(this);
        }
        this.paused = false;
        this.test(this);
      }catch(testException){
        this.addError(testException);
      }finally{
        try{
          if(!this.paused && this.teardown){
            this.teardown(this);
          }
        }catch(teardownException){
          this.addError(teardownException);
        }
      }
      return this;
    }
    Prototype.run = run;
    function benchmark(block, iterations, name){
      var startTime = (new Date()).getTime(), count = iterations, endTime;
      while(iterations--){
        block();
      }
      endTime = (new Date()).getTime();
      this.messages[this.messages.length] = sprintf("Benchmark: %s finished %i iterations in %ims.", name || this.name, count, endTime - startTime);
      return this;
    }
    Prototype.benchmark = benchmark;
    function wait(block, milliseconds){
      this.paused = true;
      this.test = block;
      this.timeout = milliseconds;
    }
    Prototype.wait = wait;
    function addInfo(){
      this.messages[this.messages.length] = "Info: " + sprintf.apply(null, arguments);
      return this;
    }
    Prototype.addInfo = addInfo;
    function addAssertion(){
      this.assertions++;
      return this;
    }
    Prototype.addAssertion = addAssertion;
    function addFailure(){
      this.failures++;
      this.messages[this.messages.length] = "Failure: " + sprintf.apply(null, arguments);
      return this;
    }
    Prototype.addFailure = addFailure;
    function addWarning(){
      this.warnings++;
      this.messages[this.messages.length] = "Warning: " + sprintf.apply(null, arguments);
      return this;
    }
    Prototype.addWarning = addWarning;
    function addError(exception){
      this.errors++;
      this.messages[this.messages.length] = "Error: " + inspect(exception);
      return this;
    }
    Prototype.addError = addError;
    function summarize(){
      return {
        "status": this.errors ? Case.CRITICAL : this.failures ? Case.FAILED : this.warnings ? Case.WARNING : Case.PASSED,
        "assertions": this.assertions,
        "warnings": this.warnings,
        "failures": this.failures,
        "errors": this.errors,
        "messages": this.messages
      };
    }
    Prototype.summarize = summarize;
    return Case;
  }());
  scotch.Group = (function(){
    var Prototype;
    function alphabetize(left, right){
      return (left.name < right.name ? -1 : left.name > right.name ? 1 : 0);
    }
    function Group(){
      this.tests = {};
      this.groups = {};
    }
    Prototype = Group.prototype;
    function addTests(setup, tests, teardown){
      for(var test in tests){
        this.tests[test] = tests[test];
      }
      this.setup = setup;
      this.teardown = teardown;
      return this;
    }
    Prototype.addTests = addTests;
    function addGroup(name){
      return (this.groups[name] || (this.groups[name] = new Group()));
    }
    Prototype.addGroup = addGroup;
    function collect(prefix){
      var results = [], name, groups, subgroups, length, extension, tests;
      (prefix || (prefix = ""));
      for(name in (groups = this.groups)){
        subgroups = groups[name].collect(prefix + name + "::");
        length = results.length;
        extension = subgroups.length;
        while(extension--){
          results[length + extension] = subgroups[extension];
        }
      }
      for(name in (tests = this.tests)){
        results[results.length] = new scotch.Case(prefix + name, tests[name], this.setup, this.teardown);
      }
      return results.sort(alphabetize);
    }
    Prototype.collect = collect;
    return Group;
  }());
  scotch.Runner = (function(){
    var Prototype, MODE = isHostType(global, "setTimeout") ? 2 : isHostType(global, "java") && isHostType(global.java, "lang") ? 1 : false;
    function Runner(name, options){
      this.name = name;
      this.options = Object(options);
      scotch.Group.call(this);
      scotch.runners[scotch.runners.length] = this;
    }
    function Subclass(){}
    Subclass.prototype = scotch.Group.prototype;
    Prototype = Runner.prototype = new Subclass();
    Subclass = null;
    Prototype.constructor = Runner;
    function next(){
      var runner = this, testcase = runner.testcases[runner.currentTest], timeout;
      if(!testcase){
        runner.finishTime = (new Date()).getTime();
        return runner.options.logger.summarize(runner.summarize());
      }
      if(!testcase.paused){
        runner.options.logger.start(testcase.name);
      }
      testcase.run();
      if(testcase.paused){
        if(MODE){
          timeout = testcase.timeout;
          runner.options.logger.write("Testing paused for " + timeout + "ms; waiting for test `" + testcase.name + "`...");
          return MODE === 2 ? global.setTimeout(function(){
            runner.next();
          }, timeout) : (new global.java.lang.Thread(new global.java.lang.Runnable({
            "run": function(){
              global.java.lang.Thread.currentThread().sleep(timeout);
              runner.next();
            }
          }))).start();
        }else{
          testcase.addWarning("Asynchronous test skipped; not supported by the current environment.");
        }
      }
      runner.options.logger.finish(testcase.summarize());
      runner.currentTest++;
      runner.next();
    }
    Prototype.next = next;
    function run(){
      this.testcases = this.collect();
      this.currentTest = 0;
      (this.options.logger || (this.options.logger = new scotch.Logger())).setup(this.name);
      this.startTime = (new Date()).getTime();
      this.next();
      return this;
    }
    Prototype.run = run;
    function summarize(){
      var testcases = this.testcases, index = 0, length = testcases.length, results = {
        "tests": length,
        "assertions": 0,
        "warnings": 0,
        "failures": 0,
        "errors": 0,
        "time": (this.finishTime - this.startTime) / 1000
      };
      for(; index < length; index++){
        results.assertions += testcases[index].assertions;
        results.warnings += testcases[index].warnings;
        results.failures += testcases[index].failures;
        results.errors += testcases[index].errors;
      }
      return results;
    }
    Prototype.summarize = summarize;
    return Runner;
  }());
  scotch.loggers = {};
  scotch.loggers.Web = (function(){
    var Prototype, LAYOUT = '<div class="logsummary">Running...<\/div><table class="logtable"><thead><tr><th>Test<\/th><th>Results<\/th><\/tr><\/thead><tbody class="loglines"><\/tbody><\/table>';
    function Web(element){
      this.element = element || Web.defaultElement;
    }
    Web.defaultElement = "testlog";
    Prototype = Web.prototype;
    function setup(suite){
      var element = this.element;
      if(getClass.call(element) === "[object String]" && !(element = this.element = document.getElementById(element))){
        throw new Error("scotch.loggers.Web: The logger element was not found.");
      }
      element.innerHTML = "<h1>" + suite + "<\/h1>" + LAYOUT;
      this.tbody = element.getElementsByTagName("tbody")[0];
      return this;
    }
    Prototype.setup = setup;
    function start(test){
      var row = document.createElement("tr"), first = document.createElement("td");
      first.appendChild(document.createTextNode(test));
      row.appendChild(first);
      row.appendChild(document.createElement("td"));
      row.appendChild(document.createElement("td"));
      this.tbody.appendChild(row);
      return this;
    }
    Prototype.start = start;
    function write(message){
      var rows = this.element.getElementsByTagName("tr");
      rows[rows.length - 1].getElementsByTagName("td")[1].innerHTML = cleanWhitespace.call(message);
      return this;
    }
    Prototype.write = write;
    function finish(summary){
      var rows = this.element.getElementsByTagName("tr"), lastLine = rows[rows.length - 1], status;
      switch(summary.status){
        case scotch.Case.CRITICAL:
        lastLine.className = "critical";
        status = "Failed";
        break;
        case scotch.Case.FAILED:
        lastLine.className = "failed";
        status = "Failed";
        break;
        case scotch.Case.WARNING:
        lastLine.className = "warning";
        status = "Passed";
        break;
        default:
        lastLine.className = "passed";
        status = "Passed";
        break;
      }
      return this.write(sprintf("<strong>%s</strong>; %i assertions, %i warnings, %i failures, %i errors.<br>", status, summary.assertions, summary.warnings, summary.failures, summary.errors) + summary.messages.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/[\r|\n]/g, "<br>"));
    }
    Prototype.finish = finish;
    function summarize(summary){
      this.element.getElementsByTagName("div")[0].innerHTML = sprintf("%i tests, %i assertions, %i warnings, %i failures, %i errors; completed in %fs", summary.tests, summary.assertions, summary.warnings, summary.failures, summary.errors, summary.time);
      return this;
    }
    Prototype.summarize = summarize;
    return Web;
  }());
  scotch.loggers.Console = (function(){
    var Prototype, print, FIREBUG_API;
    if(isHostType(global, "console") && isHostType(global.console, "log")){
      FIREBUG_API = isHostType(global.console, "info") && isHostType(global.console, "warn") && isHostType(global.console, "error");
      print = function(message, level){
        global.console[FIREBUG_API ? level >= scotch.Case.FAILED ? "error" : level === scotch.Case.WARNING ? "warn" : level === scotch.Case.PASSED ? "info" : "log" : "log"](message);
      };
    }else if(isHostType(global, "print") && !document){
      print = function(message){
        global.print(message);
      };
    }else{
      print = function(){
        throw new Error("scotch.loggers.Console: Printing output to a console is not supported by the current environment.");
      };
    }
    function Console(){
      this.tests = [];
    }
    Prototype = Console.prototype;
    function setup(suite){
      print("Started suite `" + (this.suite = suite) + "`.");
      return this;
    }
    Prototype.setup = setup;
    function start(test){
      print("Started test `" + (this.tests[this.tests.length] = test) + "`.");
      return this;
    }
    Prototype.start = start;
    function write(message){
      print(cleanWhitespace.call(message));
      return this;
    }
    Prototype.write = write;
    function finish(summary){
      var status = summary.status, messages = summary.messages, index = 0, length = summary.messages.length;
      print(sprintf("Finished test `%s` with %i assertions, %i warnings, %i failures, and %i errors.", this.tests[this.tests.length - 1], summary.assertions, summary.warnings, summary.failures, summary.errors), status);
      for(; index < length; index++){
        print(cleanWhitespace.call(messages[index]), status);
      }
      return this;
    }
    Prototype.finish = finish;
    function summarize(summary){
      print(sprintf("Finished suite `%s` in %fs with %i tests, %i assertions, %i warnings, %i failures, and %i errors.", this.suite, summary.time, summary.tests, summary.assertions, summary.warnings, summary.failures, summary.errors));
      return this;
    }
    Prototype.summarize = summarize;
    return Console;
  }());
  scotch.Logger = scotch.loggers[document ? "Web" : "Console"];
  scotch.noConflict = function(){
    delete scotch.noConflict;
    if(typeof previousScotch === "undefined"){
      delete global.scotch;
    }else{
      global.scotch = previousScotch;
    }
    return scotch;
  };
  if(isHostType(global, "addEventListener")){
    global.addEventListener("load", scotch.run, false);
  }else if(isHostType(global, "attachEvent")){
    global.attachEvent("onload", scotch.run);
  }
  global.scotch = scotch;
}(this));
