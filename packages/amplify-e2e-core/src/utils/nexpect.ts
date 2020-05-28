/*
 * nexpect.js: Top-level include for the `nexpect` module.
 *
 * (C) 2011, Elijah Insua, Marak Squires, Charlie Robbins.
 *
 */

declare global {
  namespace NodeJS {
    interface Global {
      storeCLIExecutionLog: (data: any) => void;
    }
  }
}

import { isRegExp, format } from 'util';
import { Recorder } from '../asciinema-recorder';
import { AssertionError } from 'assert';
import strip = require('strip-ansi');
import { EOL } from 'os';
import retimer = require('retimer');

const DEFAULT_NO_OUTPUT_TIMEOUT = 5 * 60 * 1000; // 5 Minutes
const EXIT_CODE_TIMEOUT = 2;
const EXIT_CODE_GENERIC_ERROR = 3;

// https://notes.burke.libbey.me/ansi-escape-codes/
export const KEY_UP_ARROW = '\x1b[A';
export const KEY_DOWN_ARROW = '\x1b[B';

type ExecutionStep = {
  fn: (data: string) => boolean;
  shift: boolean;
  description: string;
  requiresInput: boolean;
  name: string;
  expectation?: any;
};

export type Context = {
  command: string;
  cwd: string | undefined;
  env: any | undefined;
  ignoreCase: boolean;
  params: string[];
  queue: ExecutionStep[];
  stripColors: boolean;
  process: Recorder | undefined;
  noOutputTimeout: number;
  getRecording: () => string;
};

export type ExecutionContext = {
  expect: (expectation: string | RegExp) => ExecutionContext;
  pauseRecording: () => ExecutionContext;
  resumeRecording: () => ExecutionContext;
  wait: (expectation: string | RegExp, cb?: (data: string) => void) => ExecutionContext;
  sendLine: (line: string) => ExecutionContext;
  sendCarriageReturn: () => ExecutionContext;
  send: (line: string) => ExecutionContext;
  sendEof: () => ExecutionContext;
  run: (cb: (err: any, signal?: any) => void) => ExecutionContext;
};

export type SpawnOptions = {
  noOutputTimeout?: number;
  cwd?: string | undefined;
  env?: object | any;
  stripColors?: boolean;
  ignoreCase?: boolean;
};

function chain(context: Context): ExecutionContext {
  return {
    pauseRecording: (): ExecutionContext => {
      let _pauseRecording: ExecutionStep = {
        fn: () => {
          context.process.pauseRecording();
          return true;
        },
        name: '_pauseRecording',
        shift: true,
        description: '[pauseRecording]',
        requiresInput: true,
      };
      context.queue.push(_pauseRecording);

      return chain(context);
    },
    resumeRecording: (): ExecutionContext => {
      let _resumeRecording: ExecutionStep = {
        fn: data => {
          context.process.resumeRecording();
          return true;
        },
        name: '_resumeRecording',
        shift: true,
        description: '[resumeRecording]',
        requiresInput: false,
      };
      context.queue.push(_resumeRecording);

      return chain(context);
    },
    expect: function(expectation: string | RegExp): ExecutionContext {
      let _expect: ExecutionStep = {
        fn: data => {
          return testExpectation(data, expectation, context);
        },
        name: '_expect',
        shift: true,
        description: '[expect] ' + expectation,
        requiresInput: true,
        expectation: expectation,
      };
      context.queue.push(_expect);

      return chain(context);
    },

    wait: function(expectation: string | RegExp, callback = (data: string) => {}): ExecutionContext {
      let _wait: ExecutionStep = {
        fn: data => {
          var val = testExpectation(data, expectation, context);
          if (val === true && typeof callback === 'function') {
            callback(data);
          }
          return val;
        },
        name: '_wait',
        shift: false,
        description: '[wait] ' + expectation,
        requiresInput: true,
        expectation: expectation,
      };
      context.queue.push(_wait);
      return chain(context);
    },
    sendLine: function(line: string): ExecutionContext {
      let _sendline: ExecutionStep = {
        fn: () => {
          context.process.write(line + EOL);
          return true;
        },
        name: '_sendline',
        shift: true,
        description: '[sendline] ' + line,
        requiresInput: false,
      };
      context.queue.push(_sendline);
      return chain(context);
    },
    sendCarriageReturn: function(): ExecutionContext {
      let _sendline: ExecutionStep = {
        fn: () => {
          context.process.write(EOL);
          return true;
        },
        name: '_sendline',
        shift: true,
        description: '[sendline] ',
        requiresInput: false,
      };
      context.queue.push(_sendline);
      return chain(context);
    },
    send: function(line: string): ExecutionContext {
      var _send: ExecutionStep = {
        fn: () => {
          context.process.write(line);
          return true;
        },
        name: '_send',
        shift: true,
        description: '[send] ' + line,
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendEof: function(): ExecutionContext {
      var _sendEof: ExecutionStep = {
        fn: () => {
          context.process.write('');
          return true;
        },
        shift: true,
        name: '_sendEof',
        description: '[sendEof]',
        requiresInput: false,
      };
      context.queue.push(_sendEof);
      return chain(context);
    },
    run: function(callback: (err: any, code?: number, signal?: string | number) => void): ExecutionContext {
      let errState: any = null;
      let responded = false;
      let stdout: string[] = [];
      let options;
      let noOutputTimer;

      const exitHandler = (code: number, signal: any) => {
        noOutputTimer.clear();
        context.process.removeOnExitHandlers(exitHandler);
        if (code !== 0) {
          if (code === EXIT_CODE_TIMEOUT) {
            const err = new Error(
              `Killed the process as no output receive for ${context.noOutputTimeout /
                1000} Sec. The no output timeout is set to ${context.noOutputTimeout / 1000}`,
            );
            return onError(err, true);
          } else if (code === 127) {
            // XXX(sam) Not how node works (anymore?), 127 is what /bin/sh returns,
            // but it appears node does not, or not in all conditions, blithely
            // return 127 to user, it emits an 'error' from the child_process.

            //
            // If the response code is `127` then `context.command` was not found.
            //
            return onError(new Error('Command not found: ' + context.command), false);
          }
          return onError(new Error(`Process exited with non zero exit code ${code}`), false);
        } else {
          if (context.queue.length && !flushQueue()) {
            // if flushQueue returned false, onError was called
            return;
          }
          recordOutputs(code);
          callback(null, signal || code);
        }
      };
      //
      // **onError**
      //
      // Helper function to respond to the callback with a
      // specified error. Kills the child process if necessary.
      //
      function onError(err: any, kill: boolean, errorCode: number = EXIT_CODE_GENERIC_ERROR) {
        if (errState || responded) {
          return;
        }

        recordOutputs(errorCode);
        errState = err;
        responded = true;

        if (kill) {
          try {
            context.process.kill();
          } catch (ex) {}
        }

        callback(err, errorCode);
      }

      //
      // **validateFnType**
      //
      // Helper function to validate the `currentFn` in the
      // `context.queue` for the target chain.
      //
      function validateFnType(step: ExecutionStep): boolean {
        const currentFn = step.fn;
        const currentFnName = step.name;
        if (typeof currentFn !== 'function') {
          //
          // If the `currentFn` is not a function, short-circuit with an error.
          //
          onError(new Error('Cannot process non-function on nexpect stack.'), true);
          return false;
        } else if (
          ['_expect', '_sendline', '_send', '_wait', '_sendEof', '_pauseRecording', '_resumeRecording'].indexOf(currentFnName) === -1
        ) {
          //
          // If the `currentFn` is a function, but not those set by `.sendline()` or
          // `.expect()` then short-circuit with an error.
          //
          onError(new Error('Unexpected context function name: ' + currentFn.name), true);
          return false;
        }

        return true;
      }

      //
      // **evalContext**
      //
      // Core evaluation logic that evaluates the next function in
      // `context.queue` against the specified `data` where the last
      // function run had `name`.
      //
      function evalContext(data: string, name?: string): void {
        var step = context.queue[0];
        const { fn: currentFn, name: currentFnName, shift } = step;

        if (!currentFn || (name === '_expect' && currentFnName === '_expect')) {
          //
          // If there is nothing left on the context or we are trying to
          // evaluate two consecutive `_expect` functions, return.
          //
          return;
        }

        if (shift) {
          context.queue.shift();
        }

        if (!validateFnType(step)) {
          return;
        }

        if (currentFnName === '_expect') {
          //
          // If this is an `_expect` function, then evaluate it and attempt
          // to evaluate the next function (in case it is a `_sendline` function).
          //
          return currentFn(data) === true ? evalContext(data, '_expect') : onError(createExpectationError(step.expectation, data), true);
        } else if (currentFnName === '_wait') {
          //
          // If this is a `_wait` function, then evaluate it and if it returns true,
          // then evaluate the function (in case it is a `_sendline` function).
          //
          if (currentFn(data) === true) {
            context.queue.shift();
            evalContext(data, '_expect');
          }
        } else {
          //
          // If the `currentFn` is any other function then evaluate it
          //
          if (currentFn(data)) {
            // Evaluate the next function if it does not need input
            var nextFn = context.queue[0];
            if (nextFn && !nextFn.requiresInput) evalContext(data);
          }
        }
      }

      //
      // **onLine**
      //
      // Preprocesses the `data` from `context.process` on the
      // specified `context.stream` and then evaluates the processed lines:
      //
      // 1. Stripping ANSI colors (if necessary)
      // 2. Removing case sensitivity (if necessary)
      // 3. Splitting `data` into multiple lines.
      //
      function onLine(data: string | Buffer) {
        noOutputTimer.reschedule(context.noOutputTimeout);
        data = data.toString();
        if (process.env && process.env.VERBOSE_LOGGING_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
          console.log(data);
        }
        if (context.stripColors) {
          data = strip(data);
        }

        var lines = data.split(EOL).filter(function(line) {
          return line.length > 0 && line !== '\r';
        });
        stdout = stdout.concat(lines);

        while (lines.length > 0) {
          evalContext(lines.shift(), null);
        }
      }

      //
      // **flushQueue**
      //
      // Helper function which flushes any remaining functions from
      // `context.queue` and responds to the `callback` accordingly.
      //
      function flushQueue() {
        const remainingQueue = context.queue.slice().map(item => {
          const description = ['_sendline', '_send'].includes(item.name) ? `[${item.name}] **redacted**` : item.description;
          return {
            ...item,
            description,
          };
        });
        const step = context.queue.shift();
        const { fn: currentFn, name: currentFnName } = step;
        const nonEmptyLines = stdout.map(line => line.replace('\r', '').trim()).filter(line => line !== '');

        var lastLine = nonEmptyLines[nonEmptyLines.length - 1];

        if (!lastLine) {
          onError(createUnexpectedEndError('No data from child with non-empty queue.', remainingQueue), false);
          return false;
        } else if (context.queue.length > 0) {
          onError(createUnexpectedEndError('Non-empty queue on spawn exit.', remainingQueue), true);
          return false;
        } else if (!validateFnType(step)) {
          // onError was called
          return false;
        } else if (currentFnName === '_sendline') {
          onError(new Error('Cannot call sendline after the process has exited'), false);
          return false;
        } else if (currentFnName === '_wait' || currentFnName === '_expect') {
          if (currentFn(lastLine) !== true) {
            onError(createExpectationError(step.expectation, lastLine), false);
            return false;
          }
        }

        return true;
      }

      options = {
        cwd: context.cwd,
        env: context.env,
      };

      const recordOutputs = (code: number) => {
        if (global.storeCLIExecutionLog) {
          global.storeCLIExecutionLog({
            cmd: context.command,
            cwd: context.cwd,
            exitCode: code,
            params: context.params,
            recording: context.getRecording(),
          });
        }
      };

      try {
        context.process = new Recorder(context.command, context.params, options);

        context.process.addOnDataHandler(onLine);

        context.process.addOnExitHandlers(exitHandler);

        context.process.run();
        noOutputTimer = retimer(() => {
          exitHandler(EXIT_CODE_TIMEOUT, 'SIGTERM');
        }, context.noOutputTimeout);
        return chain(context);
      } catch (e) {
        onError(e, true);
      }
    },
  };
}

function testExpectation(data: string, expectation: string | RegExp, context: Context): boolean {
  if (isRegExp(expectation)) {
    return expectation.test(data);
  } else if (context.ignoreCase) {
    return data.toLowerCase().indexOf(expectation.toLowerCase()) > -1;
  } else {
    return data.indexOf(expectation) > -1;
  }
}

function createUnexpectedEndError(message: string, remainingQueue: ExecutionStep[]) {
  const desc: string[] = remainingQueue.map(function(it) {
    return it.description;
  });
  var msg = message + '\n' + desc.join('\n');

  return new AssertionError({
    message: msg,
    expected: [],
    actual: desc,
  });
}

function createExpectationError(expected: string | RegExp, actual: string) {
  var expectation;
  if (isRegExp(expected)) {
    expectation = 'to match ' + expected;
  } else {
    expectation = 'to contain ' + JSON.stringify(expected);
  }

  var err = new AssertionError({
    message: format('expected %j %s', actual, expectation),
    actual: actual,
    expected: expected,
  });
  return err;
}

export function nspawn(command: string | string[], params: string[] = [], options: SpawnOptions = {}) {
  if (Array.isArray(command)) {
    params = command;
    command = params.shift();
  } else if (typeof command === 'string') {
    command = command.split(' ');
    params = params || command.slice(1);
    command = command[0];
  }

  let context: Context = {
    command: command,
    cwd: options.cwd || undefined,
    env: options.env || undefined,
    ignoreCase: options.ignoreCase || true,
    noOutputTimeout: options.noOutputTimeout || DEFAULT_NO_OUTPUT_TIMEOUT,
    params: params,
    queue: [],
    stripColors: options.stripColors,
    process: undefined,
    getRecording: () => {
      if (context.process) {
        return context.process.getRecording();
      }
    },
  };

  return chain(context);
}
