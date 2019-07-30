/*
 * nexpect-test.js: Tests for the `nexpect` module.
 *
 * (C) 2011, Elijah Insua, Marak Squires, Charlie Robbins.
 *
 */

var assert = require('assert'),
    path = require('path'),
    vows = require('vows'),
    spawn = require('child_process').spawn,
    nexpect = require('../lib/nexpect');

function assertSpawn (expect) {
  return {
    topic: function () {
      expect.run(this.callback);
    },
    "should respond with no error": function (err, stdout) {
      assert.isTrue(!err);
      assert.isArray(stdout);
    }
  };
}

function assertError (expect) {
  return {
    topic: function () {
      expect.run(this.callback.bind(this, null));
    },
    "should respond with error": function (err) {
      assert.isObject(err);
    }
  };
}

vows.describe('nexpect').addBatch({
  "When using the nexpect module": {
    "it should have the correct methods defined": function () {
      assert.isFunction(nexpect.spawn);
      assert.isObject(nexpect.nspawn);
      assert.isFunction(nexpect.nspawn.spawn);
    },
    "spawning": {
      "`echo hello`": assertSpawn(
        nexpect.spawn("echo", ["hello"])
               .expect("hello")
      ),
      "`ls -l /tmp/undefined`": assertSpawn(
        nexpect.spawn("ls -la /tmp/undefined", { stream: 'stderr' })
               .expect("No such file or directory")
      ),
      "a command that does not exist": assertError(
        nexpect.spawn("idontexist")
               .expect("This will never work")
      ),
      "and using the sendline() method": assertSpawn(
        nexpect.spawn("node --interactive")
              .expect(">")
              .sendline("console.log('testing')")
              .expect("testing")
              .sendline("process.exit()")
      ),
      "and using the expect() method": {
        "when RegExp expectation is met": assertSpawn(
          nexpect.spawn("echo", ["hello"])
                 .expect(/^hello$/)
        ),
      },
      "and using the wait() method": {
        "when assertions are met": assertSpawn(
          nexpect.spawn(path.join(__dirname, 'fixtures', 'prompt-and-respond'))
                 .wait('first')
                 .sendline('first-prompt')
                 .expect('first-prompt')
                 .wait('second')
                 .sendline('second-prompt')
                 .expect('second-prompt')
        ),
        "when the last assertion is never met": assertError(
          nexpect.spawn(path.join(__dirname, 'fixtures', 'prompt-and-respond'))
                 .wait('first')
                 .sendline('first-prompt')
                 .expect('first-prompt')
                 .wait('second')
                 .sendline('second-prompt')
                 .wait('this-never-shows-up')
        ),
        "when a callback is provided and output is matched": {
          topic: function() {
            var expect = nexpect.spawn(path.join(__dirname, 'fixtures', 'prompt-and-respond'))
              .wait('first', this.callback)
              .sendline('first-prompt')
              .expect('first-prompt')
              .wait('second')
              .sendline('second-prompt')
              .expect('second-prompt').run(function() {});
          },
          'should call callback': function(matchData, b) {
            assert.ok(matchData.indexOf('first') > 0, "Found 'first' in output")
          }
        },
        "when a callback is provided and output is not matched": {
          topic: function() {
            var args = {hasRunCallback: false},
                waitCallback = function() {
                  args.hasRunCallback = true;
                };

            var expect = nexpect.spawn(path.join(__dirname, 'fixtures', 'prompt-and-respond'))
              .wait('first')
              .sendline('first-prompt')
              .expect('first-prompt')
              .wait('second')
              .sendline('second-prompt')
              .wait('this-never-shows-up', waitCallback).run(this.callback.bind(this, args));
          },
          'should not call callback': function(args, a) {
            assert.equal(args.hasRunCallback, false, 'Should not have run callback');
          }
        }
      },
      "when options.stripColors is set": assertSpawn(
        nexpect.spawn(path.join(__dirname, 'fixtures', 'log-colors'), { stripColors: true })
               .wait('second has colors')
               .expect('third has colors')
      ),
      "when options.ignoreCase is set": assertSpawn(
        nexpect.spawn(path.join(__dirname, 'fixtures', 'multiple-cases'), { ignoreCase: true })
               .wait('this has many cases')
               .expect('this also has many cases')
      ),
      "when options.cwd is set": assertSpawn(
        nexpect.spawn(path.join(__dirname, 'fixtures', 'show-cwd'), { cwd: path.join(__dirname, 'fixtures') })
               .wait(path.join(__dirname, 'fixtures'))
      ),
      "when options.env is set": assertSpawn(
        nexpect.spawn(path.join(__dirname, 'fixtures', 'show-env'), { env: { foo: 'bar', PATH: process.env.PATH }})
          .expect('foo=bar')
      )
    }
  }
}).export(module);
