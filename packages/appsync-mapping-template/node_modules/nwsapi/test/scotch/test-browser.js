var caseRunner = scotch("scotch.Case Unit Tests", {
  "logger": new scotch.loggers.Web("case")
}), identifier = 0;

/* Custom assertion */
scotch.assertions.assertSuccessiveList = function(array, message){
  var index = 1, length = array.length, value;
  for(; index < length; index++){
    value = array[index];
    if(!(Object.prototype.toString.call(value) === "[object Number]" && value - 1 === array[index - 1])){
      return this.addFailure("`assertSuccessiveList`: List: %o, Message: %s.", array, message || "The array is not successive");
    }
  }
  return this.addAssertion();
};

caseRunner.addTests(function(){
  //Setup function
  this.array = [1, 2, 3, 4, 5, 6, 7];
  this.assertEqual(identifier, 0);
}, {
  "benchmark": function(){
    identifier++;
    var str = "12.5";
    this.assert(~~(1 * str) === 12);
    this.assert(parseInt(str, 10) === 12);
    this.benchmark(function(){
      ~~(1 * str);
    }, 1000000, "~~");
    this.benchmark(function(){
      parseInt(str, 10);
    }, 1000000, "parseInt");
  },
  "assert": function(testcase){
    testcase.assertEquivalent(this.array, [1, 2, 3, 4, 5, 6, 7]);
    this.assertSuccessiveList(testcase.array);
    identifier++;
  },
  "wait": function(){
    identifier++;
    var timeout = 0;
    this.assertEqual(0, timeout);
    this.wait(function(){
      timeout += this.timeout;
      this.assertEqual(150, timeout);
      this.wait(function(){
        timeout += this.timeout;
        this.assertEqual(300, this.timeout);
        this.assertEqual(450, timeout);
      }, 300);
    }, 150);
  }
}, function(){
  //Teardown function
  this.refuteEqual(identifier, 0);
  identifier = 0;
});

var assertionsRunner = scotch("scotch.assertions Unit Tests", {
  "logger": new scotch.loggers.Web("assertions")
});

assertionsRunner.addTests(null, {
  "assert": function(){
    this.assert(true);
    this.assert(!false, "test");
    this.assert(true).assert(5 + 5 === 10, "`scotch.assertions.assert` should be chainable");
  },
  "refute": function(){
    this.refute(false);
    this.refute(!true, "test");
    this.refute(false).refute(5 % 2 === 2, "`scotch.assertions.refute` should be chainable");
  }
});

/* Basic equality */
assertionsRunner.addGroup("Equality").addTests(null, {
  "assertLike": function(){
    this.assertLike(0, 0);
    this.assertLike(0, 0, "test");
    this.assertLike(0, "0");
    this.assertLike(65.0, 65);
    this.assertLike("a", "a");
    this.assertLike("a", "a", "test");
  },
  "refuteLike": function(){
    this.refuteLike(0, 1);
    this.refuteLike("a", "b");
    this.refuteLike({}, {});
    this.refuteLike([], []);
    this.refuteLike([], {});
  }
});

/* Basic identity */
assertionsRunner.addGroup("Identity").addTests(null, {
  "assertEqual": function(){
    var undef, object = {"a": "b"};
    this.assertEqual(0, 0);
    this.assertEqual(0, 0, "test");
    this.assertEqual(1, 1);
    this.assertEqual(1, 1.0);
    this.assertEqual("a", "a");
    this.assertEqual("a", "a", "test");
    this.assertEqual("", "");
    this.assertEqual(undef, undef);
    this.assertEqual(null, null);
    this.assertEqual(true, true);
    this.assertEqual(false, false);
    this.assertEqual(object, object);
  },
  "refuteEqual": function(){
    this.refuteEqual({1:2,3:4}, {1:2,3:4});
    this.refuteEqual(1, "1");
    this.refuteEqual(1.0, "1");
  }
});

/* Equivalence */
assertionsRunner.addGroup("Equivalence").addTests(null, {
  "assertEquivalent": function(){
    /* Lists/Arrays */
    this.assertEquivalent([], []);
    this.assertEquivalent(["a", "b"], ["a", "b"]);
    this.assertEquivalent([1, 2], [1, 2]);
    this.assertEquivalent(["1", "2"], ["1", "2"]);
    this.assertEquivalent([7, 8, 9], [7, 8, new Number(9)]);
    this.assertEquivalent([1, [2, 3, [4, [5]]]], [1, [2, 3, [4, [5]]]], "Deep comparison failed");
    /* Hashes/Objects */
    this.assertEquivalent({}, {});
    this.assertEquivalent({"a": "b"}, {"a": "b"});
    this.assertEquivalent({"a": "b", "c": "d"}, {"a": "b", "c": "d"});
    this.assertEquivalent({"a": 1, "z": 2}, {"z": 2, "a": 1}, "Order shouldn't matter");
    this.assertEquivalent({"a": {"b": "c", "d": "e"}, "f": "g"}, {"a": {"b": "c", "d": "e"}, "f": "g"}, "Deep comparison failed");
  },
  "refuteEquivalent": function(){
    /* Lists/Arrays */
    this.refuteEquivalent(["a"], ["b"]);
    this.refuteEquivalent([1, 2], [1, 2, 3]);
    this.refuteEquivalent(["1", "2"], [1, 2]);
    this.refuteEquivalent([7, 8, 9], ["7", 8, new Number(9)]);
    /* Hashes/Objects */
    this.refuteEquivalent({"a": "b", "c": "d"}, {"c": "d", "a": "boo!"});
    this.refuteEquivalent({"a": "1", "z": "2"}, {"z": 2, "a": 1});
  }
});

/* Functions */
assertionsRunner.addGroup("Functions").addTests(null, {
  "assertThrowsException": function(){
    function testError(){
      throw new Error();
    }
    this.assertThrowsException(/Error/, testError);
  },
  "assertThrowsNothing": function(){
    function testNoError(){
      return true;
    }
    this.assertThrowsNothing(testNoError);
  }
});
