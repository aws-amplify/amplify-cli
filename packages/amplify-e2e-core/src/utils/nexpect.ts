/*
 * nexpect.js: Top-level include for the `nexpect` module.
 *
 * (C) 2011, Elijah Insua, Marak Squires, Charlie Robbins.
 *
 */

import { types, format } from 'util';
import { AssertionError } from 'assert';
import strip = require('strip-ansi');
import { EOL } from 'os';
import retimer = require('retimer');
import { join, parse } from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { Recorder } from '../asciinema-recorder';
import { generateRandomShortId, getScriptRunnerPath, isTestingWithLatestCodebase } from '..';

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace NodeJS {
    interface Global {
      storeCLIExecutionLog: (data: any) => void;
    }
  }
  /* eslint-enable */
}
export const RETURN = process.platform === 'win32' ? '\r' : EOL;
const DEFAULT_NO_OUTPUT_TIMEOUT = process.env.AMPLIFY_TEST_TIMEOUT_SEC
  ? Number.parseInt(process.env.AMPLIFY_TEST_TIMEOUT_SEC, 10) * 1000
  : 5 * 60 * 1000; // 5 Minutes
const EXIT_CODE_TIMEOUT = 2;
const EXIT_CODE_GENERIC_ERROR = 3;

// https://notes.burke.libbey.me/ansi-escape-codes/
export const KEY_UP_ARROW = '\x1b[A';
export const KEY_DOWN_ARROW = '\x1b[B';
// https://donsnotes.com/tech/charsets/ascii.html
export const CONTROL_C = '\x03';
export const CONTROL_A = '\x01';
export const SPACE_BAR = '\x20';

type ExecutionStep = {
  fn: (data: string) => boolean;
  shift: boolean;
  description: string;
  requiresInput: boolean;
  name: string;
  expectation?: any;
};

/**
 *
 */
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

/**
 *
 */
export type ExecutionContext = {
  expect: (expectation: string | RegExp) => ExecutionContext;
  pauseRecording: () => ExecutionContext;
  resumeRecording: () => ExecutionContext;
  wait: (expectation: string | RegExp, cb?: (data: string) => void) => ExecutionContext;
  sendLine: (line: string) => ExecutionContext;
  sendCarriageReturn: () => ExecutionContext;
  send: (line: string) => ExecutionContext;
  sendKeyDown: (repeat?: number) => ExecutionContext;
  sendKeyUp: (repeat?: number) => ExecutionContext;
  /**
   * @deprecated If using `amplify-prompts` sending a newline after 'y' is not required and could cause problems. Use `sendYes` instead.
   */
  sendConfirmYes: () => ExecutionContext;
  sendYes: () => ExecutionContext;
  /**
   * @deprecated If using `amplify-prompts` sending a newline after 'n' is not required and could cause problems. Use `sendNo` instead.
   */
  sendConfirmNo: () => ExecutionContext;
  sendNo: () => ExecutionContext;
  sendCtrlC: () => ExecutionContext;
  sendCtrlA: () => ExecutionContext;
  selectAll: () => ExecutionContext;
  sendEof: () => ExecutionContext;
  delay: (milliseconds: number) => ExecutionContext;
  /**
   * @deprecated Use runAsync
   */
  run: (cb: (err: any, signal?: any) => void) => ExecutionContext;
  runAsync: (expectedErrorPredicate?: (err: Error) => boolean) => Promise<void>;
};

/**
 *
 */
export type SpawnOptions = {
  noOutputTimeout?: number;
  cwd?: string | undefined;
  env?: object | any;
  stripColors?: boolean;
  ignoreCase?: boolean;
  disableCIDetection?: boolean;
};

function chain(context: Context): ExecutionContext {
  const partialExecutionContext = {
    pauseRecording: (): ExecutionContext => {
      const _pauseRecording: ExecutionStep = {
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
      const _resumeRecording: ExecutionStep = {
        fn: () => {
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
    expect(expectation: string | RegExp): ExecutionContext {
      const _expect: ExecutionStep = {
        fn: (data) => testExpectation(data, expectation, context),
        name: '_expect',
        shift: true,
        description: `[expect] ${expectation}`,
        requiresInput: true,
        expectation,
      };
      context.queue.push(_expect);

      return chain(context);
    },

    wait(
      expectation: string | RegExp,
      callback: (data: string) => void = () => {
        // empty
      },
    ): ExecutionContext {
      const _wait: ExecutionStep = {
        fn: (data) => {
          const val = testExpectation(data, expectation, context);
          if (val === true && typeof callback === 'function') {
            callback(data);
          }
          return val;
        },
        name: '_wait',
        shift: false,
        description: `[wait] ${expectation}`,
        requiresInput: true,
        expectation,
      };
      context.queue.push(_wait);
      return chain(context);
    },
    sendLine(line: string): ExecutionContext {
      const _sendline: ExecutionStep = {
        fn: () => {
          context.process.write(`${line}${RETURN}`);
          return true;
        },
        name: '_sendline',
        shift: true,
        description: `[sendline] ${line}`,
        requiresInput: false,
      };
      context.queue.push(_sendline);
      return chain(context);
    },
    sendCarriageReturn(): ExecutionContext {
      const _sendline: ExecutionStep = {
        fn: () => {
          context.process.write(RETURN);
          return true;
        },
        name: '_sendline',
        shift: true,
        description: '[sendline] <CR>',
        requiresInput: false,
      };
      context.queue.push(_sendline);
      return chain(context);
    },
    send(line: string): ExecutionContext {
      const _send: ExecutionStep = {
        fn: () => {
          context.process.write(line);
          return true;
        },
        name: '_send',
        shift: true,
        description: `[send] ${line}`,
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendKeyDown(repeat?: number): ExecutionContext {
      const repetitions = repeat ? Math.max(1, repeat) : 1;
      const _send: ExecutionStep = {
        fn: () => {
          for (let i = 0; i < repetitions; ++i) {
            context.process.write(KEY_DOWN_ARROW);
          }
          return true;
        },
        name: '_send',
        shift: true,
        description: `'[send] <Down> (${repetitions})`,
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendKeyUp(repeat?: number): ExecutionContext {
      const repetitions = repeat ? Math.max(1, repeat) : 1;
      const _send: ExecutionStep = {
        fn: () => {
          for (let i = 0; i < repetitions; ++i) {
            context.process.write(KEY_UP_ARROW);
          }
          return true;
        },
        name: '_send',
        shift: true,
        description: `'[send] <Up> (${repetitions})`,
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendConfirmYes(): ExecutionContext {
      const _send: ExecutionStep = {
        fn: () => {
          context.process.write(`Y${RETURN}`);
          return true;
        },
        name: '_send',
        shift: true,
        description: "'[send] Y <CR>",
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendYes(): ExecutionContext {
      const _send: ExecutionStep = {
        fn: () => {
          context.process.write('Y');
          return true;
        },
        name: '_send',
        shift: true,
        description: "'[send] Y <CR>",
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendConfirmNo(): ExecutionContext {
      const _send: ExecutionStep = {
        fn: () => {
          context.process.write(`N${RETURN}`);
          return true;
        },
        name: '_send',
        shift: true,
        description: "'[send] N <CR>",
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendNo(): ExecutionContext {
      const _send: ExecutionStep = {
        fn: () => {
          context.process.write('N');
          return true;
        },
        name: '_send',
        shift: true,
        description: '[send] N',
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendCtrlC(): ExecutionContext {
      const _send: ExecutionStep = {
        fn: () => {
          context.process.write(`${CONTROL_C}${RETURN}`);
          return true;
        },
        name: '_send',
        shift: true,
        description: '[send] Ctrl+C',
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    sendCtrlA(): ExecutionContext {
      const _send: ExecutionStep = {
        fn: () => {
          context.process.write(`${CONTROL_A}`);
          return true;
        },
        name: '_send',
        shift: true,
        description: '[send] Ctrl+A',
        requiresInput: false,
      };
      context.queue.push(_send);
      return chain(context);
    },
    selectAll(): ExecutionContext {
      /*
        Delays are added because multi-select re-renders when making transitions.
        Sending Ctrl+A or confirmation while prompter state settles might not be reflected on the CLI side.
        Delays are arbitrary. The alternative of tracking prompt transitions would be much more complicated
        given variety of rendering styles, but should be pursued if this solution stops working.
      */
      return this.delay(1000).sendCtrlA().delay(1000).sendCarriageReturn();
    },
    sendEof(): ExecutionContext {
      const _sendEof: ExecutionStep = {
        fn: () => {
          context.process.sendEof();
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
    delay(milliseconds: number): ExecutionContext {
      const _delay: ExecutionStep = {
        fn: () => {
          /*
            Code below is workaround for lack of synchronous sleep() in JS.
            It has nothing to do with atomicity nor with buffers. It's just using these
            built-in APIs to wait synchronously. I.e. it waits number of milliseconds for
            byte transition in the buffer that never happens.
            This replaced active spin-lock that was here before
            and was burning 100% CPU while waiting that led to spawned CLI starvation.
            If this way of delaying becomes insufficient then this module should
            be refactored and implement fully asynchronous input handlers.
          */
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
          return true;
        },
        shift: true,
        name: '_delay',
        description: `'[delay] (${milliseconds})`,
        requiresInput: false,
      };
      context.queue.push(_delay);
      return chain(context);
    },
  };
  const run = (callback: (err: any, code?: number, signal?: string | number) => void): ExecutionContext => {
    let errState: any = null;
    let responded = false;
    let stdout: string[] = [];
    let noOutputTimer;

    let logDumpFile: fs.WriteStream;

    if (process.env.VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED) {
      const logdir = join(os.tmpdir(), 'amplify_e2e_logs');
      fs.ensureDirSync(logdir);
      const filename = join(logdir, `amplify_e2e_log_${generateRandomShortId()}`);
      logDumpFile = fs.createWriteStream(filename);
      console.log(`CLI test logs at [${filename}]`);
    }

    const exitHandler = (code: number, signal: any) => {
      noOutputTimer.clear();
      context.process.removeOnExitHandlers(exitHandler);
      if (logDumpFile) {
        logDumpFile.close();
      }
      if (code !== 0) {
        if (code === EXIT_CODE_TIMEOUT) {
          const recordings = context.process?.getRecordingFrames() || [];
          const lastScreen = recordings.length
            ? recordings
                .filter((f) => f[1] === 'o')
                .map((f) => f[2])
                .slice(-10)
                .join('\n')
            : 'No output';
          const err = new Error(
            `Killed the process as no output receive for ${context.noOutputTimeout / 1000} Sec. The no output timeout is set to ${
              context.noOutputTimeout / 1000
            } seconds.\n\nLast 10 lines:👇🏽👇🏽👇🏽👇🏽\n\n\n\n\n${lastScreen}\n\n\n👆🏼👆🏼👆🏼👆🏼`,
          );
          err.stack = undefined;
          return onError(err, true);
        }
        if (code === 127) {
          // XXX(sam) Not how node works (anymore?), 127 is what /bin/sh returns,
          // but it appears node does not, or not in all conditions, blithely
          // return 127 to user, it emits an 'error' from the child_process.

          //
          // If the response code is `127` then `context.command` was not found.
          //
          return onError(new Error(`Command not found: ${context.command}`), false);
        }
        return onError(new Error(`Process exited with non zero exit code ${code}`), false);
      }
      if (context.queue.length && !flushQueue()) {
        // if flushQueue returned false, onError was called
        return undefined;
      }
      recordOutputs(code);
      callback(null, signal || code);
      return undefined;
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
        } catch (ex) {
          // ignore error
        }
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
      }
      if (
        ['_expect', '_sendline', '_send', '_wait', '_sendEof', '_delay', '_pauseRecording', '_resumeRecording'].indexOf(currentFnName) ===
        -1
      ) {
        //
        // If the `currentFn` is a function, but not those set by `.sendline()` or
        // `.expect()` then short-circuit with an error.
        //
        onError(new Error(`Unexpected context function name: ${currentFn.name}`), true);
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
      const step = context.queue[0];
      const { fn: currentFn, name: currentFnName, shift } = step;

      if (!currentFn || (name === '_expect' && currentFnName === '_expect')) {
        //
        // If there is nothing left on the context or we are trying to
        // evaluate two consecutive `_expect` functions, return.
        //
        return undefined;
      }

      if (shift) {
        context.queue.shift();
      }

      if (!validateFnType(step)) {
        return undefined;
      }

      if (currentFnName === '_expect') {
        //
        // If this is an `_expect` function, then evaluate it and attempt
        // to evaluate the next function (in case it is a `_sendline` function).
        //
        return currentFn(data) === true ? evalContext(data, '_expect') : onError(createExpectationError(step.expectation, data), true);
      }
      if (currentFnName === '_wait') {
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
          const nextFn = context.queue[0];
          if (nextFn && !nextFn.requiresInput) evalContext(data);
        }
      }
      return undefined;
    }

    const spinnerRegex = new RegExp(/.*(⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏).*/);

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
      if (logDumpFile && spinnerRegex.test(data) === false && strip(data).trim().length > 0) {
        logDumpFile.write(`${data}${EOL}`);
      }

      if (context.stripColors) {
        data = strip(data);
      }

      const lines = data.split(EOL).filter((line) => line.length > 0 && line !== '\r');
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
      const remainingQueue = context.queue.slice().map((item) => {
        const description = ['_sendline', '_send'].includes(item.name) ? `[${item.name}] **redacted**` : item.description;
        return {
          ...item,
          description,
        };
      });
      const step = context.queue.shift();
      const { fn: currentFn, name: currentFnName } = step;
      const nonEmptyLines = stdout.map((line) => line.replace('\r', '').trim()).filter((line) => line !== '');

      const lastLine = nonEmptyLines[nonEmptyLines.length - 1];

      if (!lastLine) {
        onError(createUnexpectedEndError('No data from child with non-empty queue.', remainingQueue), false);
        return false;
      }
      if (context.queue.length > 0) {
        onError(createUnexpectedEndError('Non-empty queue on spawn exit.', remainingQueue), true);
        return false;
      }
      if (!validateFnType(step)) {
        // onError was called
        return false;
      }
      if (currentFnName === '_sendline') {
        onError(new Error('Cannot call sendline after the process has exited'), false);
        return false;
      }
      if (currentFnName === '_wait' || currentFnName === '_expect') {
        if (currentFn(lastLine) !== true) {
          onError(createExpectationError(step.expectation, lastLine), false);
          return false;
        }
      }

      return true;
    }

    const options = {
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
    return undefined;
  };
  return {
    ...partialExecutionContext,
    run,
    runAsync: (expectedErrorPredicate?: (err: Error) => boolean) =>
      new Promise<void>((resolve, reject) =>
        run((err) =>
          (expectedErrorPredicate && expectedErrorPredicate(err)) || (!err && !expectedErrorPredicate) ? resolve() : reject(err),
        ),
      ),
  };
}

function testExpectation(data: string, expectation: string | RegExp, context: Context): boolean {
  if (types.isRegExp(expectation)) {
    return expectation.test(data);
  }
  if (context.ignoreCase) {
    return data.toLowerCase().indexOf(expectation.toLowerCase()) > -1;
  }
  return data.indexOf(expectation) > -1;
}

function createUnexpectedEndError(message: string, remainingQueue: ExecutionStep[]) {
  const desc: string[] = remainingQueue.map((it) => it.description);
  const msg = `${message}\n${desc.join('\n')}`;

  return new AssertionError({
    message: msg,
    expected: [],
    actual: desc,
  });
}

function createExpectationError(expected: string | RegExp, actual: string) {
  let expectation;
  if (types.isRegExp(expected)) {
    expectation = `to match ${expected}`;
  } else {
    expectation = `to contain ${JSON.stringify(expected)}`;
  }

  const err = new AssertionError({
    message: format('expected %j %s', actual, expectation),
    actual,
    expected,
  });
  return err;
}

/**
 *
 */
export function nspawn(command: string | string[], params: string[] = [], options: SpawnOptions = {}) {
  if (Array.isArray(command)) {
    params = command;
    command = params.shift();
  } else if (typeof command === 'string') {
    const parsedPath = parse(command);
    const parsedArgs = parsedPath.base.split(' ');
    command = join(parsedPath.dir, parsedArgs[0]);
    params = params || parsedArgs.slice(1);
  }

  const testingWithLatestCodebase = isTestingWithLatestCodebase(command);
  if (testingWithLatestCodebase || (process.platform === 'win32' && !(command.endsWith('.exe') || command.endsWith('.cmd')))) {
    params.unshift(command);
    command = getScriptRunnerPath(testingWithLatestCodebase);
  }

  if (process.platform === 'win32' && !command.endsWith('powershell.exe')) {
    params.unshift(command);
    command = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
  }

  let childEnv;
  let pushEnv;

  // For push operations in E2E we have to explicitly disable the Amplify Console App creation
  // as for the tests that need it, it is already enabled for init, setting the env var here
  // disables the post push check we have in the CLI.
  if (params.length > 0 && params.some((param: string) => param.toLowerCase() === 'push')) {
    pushEnv = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  // If we have an environment passed in we've to add the current process' environment, otherwised the forked
  // process would not have $PATH and others that is required to run amplify-cli successfully.
  // to be able to disable CI detection we do need to pass in a childEnv
  if (options.env || pushEnv || options.disableCIDetection === true) {
    childEnv = {
      ...process.env,
      ...pushEnv,
      ...options.env,
      NODE_OPTIONS: '--max_old_space_size=4096',
    };

    // Undo ci-info detection, required for some tests
    // see https://github.com/watson/ci-info/blob/master/index.js#L57
    if (options.disableCIDetection === true) {
      childEnv.CI = false;
    }
  }

  const context: Context = {
    command,
    cwd: options.cwd || undefined,
    env: childEnv || undefined,
    ignoreCase: options.ignoreCase || true,
    noOutputTimeout: options.noOutputTimeout || DEFAULT_NO_OUTPUT_TIMEOUT,
    params,
    queue: [],
    stripColors: options.stripColors,
    process: undefined,
    getRecording: () => {
      if (context.process) {
        return context.process.getRecording();
      }
      return undefined;
    },
  };

  return chain(context);
}
