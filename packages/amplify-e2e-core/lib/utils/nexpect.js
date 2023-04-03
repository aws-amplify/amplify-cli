"use strict";
/*
 * nexpect.js: Top-level include for the `nexpect` module.
 *
 * (C) 2011, Elijah Insua, Marak Squires, Charlie Robbins.
 *
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nspawn = exports.SPACE_BAR = exports.CONTROL_A = exports.CONTROL_C = exports.KEY_DOWN_ARROW = exports.KEY_UP_ARROW = exports.RETURN = void 0;
const util_1 = require("util");
const assert_1 = require("assert");
const strip = require("strip-ansi");
const os_1 = require("os");
const retimer = require("retimer");
const path_1 = require("path");
const fs = __importStar(require("fs-extra"));
const os = __importStar(require("os"));
const asciinema_recorder_1 = require("../asciinema-recorder");
const __1 = require("..");
exports.RETURN = process.platform === 'win32' ? '\r' : os_1.EOL;
const DEFAULT_NO_OUTPUT_TIMEOUT = process.env.AMPLIFY_TEST_TIMEOUT_SEC
    ? Number.parseInt(process.env.AMPLIFY_TEST_TIMEOUT_SEC, 10) * 1000
    : 5 * 60 * 1000; // 5 Minutes
const EXIT_CODE_TIMEOUT = 2;
const EXIT_CODE_GENERIC_ERROR = 3;
// https://notes.burke.libbey.me/ansi-escape-codes/
exports.KEY_UP_ARROW = '\x1b[A';
exports.KEY_DOWN_ARROW = '\x1b[B';
// https://donsnotes.com/tech/charsets/ascii.html
exports.CONTROL_C = '\x03';
exports.CONTROL_A = '\x01';
exports.SPACE_BAR = '\x20';
function chain(context) {
    const partialExecutionContext = {
        pauseRecording: () => {
            const _pauseRecording = {
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
        resumeRecording: () => {
            const _resumeRecording = {
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
        expect(expectation) {
            const _expect = {
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
        wait(expectation, callback = (data) => {
            // empty
        }) {
            const _wait = {
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
        sendLine(line) {
            const _sendline = {
                fn: () => {
                    context.process.write(`${line}${exports.RETURN}`);
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
        sendCarriageReturn() {
            const _sendline = {
                fn: () => {
                    context.process.write(exports.RETURN);
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
        send(line) {
            const _send = {
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
        sendKeyDown(repeat) {
            const repetitions = repeat ? Math.max(1, repeat) : 1;
            const _send = {
                fn: () => {
                    for (let i = 0; i < repetitions; ++i) {
                        context.process.write(exports.KEY_DOWN_ARROW);
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
        sendKeyUp(repeat) {
            const repetitions = repeat ? Math.max(1, repeat) : 1;
            const _send = {
                fn: () => {
                    for (let i = 0; i < repetitions; ++i) {
                        context.process.write(exports.KEY_UP_ARROW);
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
        sendConfirmYes() {
            const _send = {
                fn: () => {
                    context.process.write(`Y${exports.RETURN}`);
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
        sendYes() {
            const _send = {
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
        sendConfirmNo() {
            const _send = {
                fn: () => {
                    context.process.write(`N${exports.RETURN}`);
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
        sendNo() {
            const _send = {
                fn: () => {
                    context.process.write('N');
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
        sendCtrlC() {
            const _send = {
                fn: () => {
                    context.process.write(`${exports.CONTROL_C}${exports.RETURN}`);
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
        sendCtrlA() {
            const _send = {
                fn: () => {
                    context.process.write(`${exports.CONTROL_A}`);
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
        selectAll() {
            /*
              Delays are added because multi-select re-renders when making transitions.
              Sending Ctrl+A or confirmation while prompter state settles might not be reflected on the CLI side.
              Delays are arbitrary. The alternative of tracking prompt transitions would be much more complicated
              given variety of rendering styles, but should be pursued if this solution stops working.
            */
            return this.delay(1000).sendCtrlA().delay(1000).sendCarriageReturn();
        },
        sendEof() {
            const _sendEof = {
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
        delay(milliseconds) {
            const _delay = {
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
    const run = (callback) => {
        let errState = null;
        let responded = false;
        let stdout = [];
        let noOutputTimer;
        let logDumpFile;
        if (process.env.VERBOSE_LOGGING_DO_NOT_USE_IN_CI_OR_YOU_WILL_BE_FIRED) {
            const logdir = (0, path_1.join)(os.tmpdir(), 'amplify_e2e_logs');
            fs.ensureDirSync(logdir);
            const filename = (0, path_1.join)(logdir, `amplify_e2e_log_${(0, __1.generateRandomShortId)()}`);
            logDumpFile = fs.createWriteStream(filename);
            console.log(`CLI test logs at [${filename}]`);
        }
        const exitHandler = (code, signal) => {
            var _a;
            noOutputTimer.clear();
            context.process.removeOnExitHandlers(exitHandler);
            if (logDumpFile) {
                logDumpFile.close();
            }
            if (code !== 0) {
                if (code === EXIT_CODE_TIMEOUT) {
                    const recordings = ((_a = context.process) === null || _a === void 0 ? void 0 : _a.getRecordingFrames()) || [];
                    const lastScreen = recordings.length
                        ? recordings
                            .filter((f) => f[1] === 'o')
                            .map((f) => f[2])
                            .slice(-10)
                            .join('\n')
                        : 'No output';
                    const err = new Error(`Killed the process as no output receive for ${context.noOutputTimeout / 1000} Sec. The no output timeout is set to ${context.noOutputTimeout / 1000} seconds.\n\nLast 10 lines:👇🏽👇🏽👇🏽👇🏽\n\n\n\n\n${lastScreen}\n\n\n👆🏼👆🏼👆🏼👆🏼`);
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
        function onError(err, kill, errorCode = EXIT_CODE_GENERIC_ERROR) {
            if (errState || responded) {
                return;
            }
            recordOutputs(errorCode);
            errState = err;
            responded = true;
            if (kill) {
                try {
                    context.process.kill();
                }
                catch (ex) {
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
        function validateFnType(step) {
            const currentFn = step.fn;
            const currentFnName = step.name;
            if (typeof currentFn !== 'function') {
                //
                // If the `currentFn` is not a function, short-circuit with an error.
                //
                onError(new Error('Cannot process non-function on nexpect stack.'), true);
                return false;
            }
            if (['_expect', '_sendline', '_send', '_wait', '_sendEof', '_delay', '_pauseRecording', '_resumeRecording'].indexOf(currentFnName) ===
                -1) {
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
        function evalContext(data, name) {
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
            }
            else {
                //
                // If the `currentFn` is any other function then evaluate it
                //
                if (currentFn(data)) {
                    // Evaluate the next function if it does not need input
                    const nextFn = context.queue[0];
                    if (nextFn && !nextFn.requiresInput)
                        evalContext(data);
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
        function onLine(data) {
            noOutputTimer.reschedule(context.noOutputTimeout);
            data = data.toString();
            if (logDumpFile && spinnerRegex.test(data) === false && strip(data).trim().length > 0) {
                logDumpFile.write(`${data}${os_1.EOL}`);
            }
            if (context.stripColors) {
                data = strip(data);
            }
            const lines = data.split(os_1.EOL).filter((line) => line.length > 0 && line !== '\r');
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
                return Object.assign(Object.assign({}, item), { description });
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
        const recordOutputs = (code) => {
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
            context.process = new asciinema_recorder_1.Recorder(context.command, context.params, options);
            context.process.addOnDataHandler(onLine);
            context.process.addOnExitHandlers(exitHandler);
            context.process.run();
            noOutputTimer = retimer(() => {
                exitHandler(EXIT_CODE_TIMEOUT, 'SIGTERM');
            }, context.noOutputTimeout);
            return chain(context);
        }
        catch (e) {
            onError(e, true);
        }
        return undefined;
    };
    return Object.assign(Object.assign({}, partialExecutionContext), { run, runAsync: (expectedErrorPredicate) => new Promise((resolve, reject) => run((err) => (expectedErrorPredicate && expectedErrorPredicate(err)) || (!err && !expectedErrorPredicate) ? resolve() : reject(err))) });
}
function testExpectation(data, expectation, context) {
    if (util_1.types.isRegExp(expectation)) {
        return expectation.test(data);
    }
    if (context.ignoreCase) {
        return data.toLowerCase().indexOf(expectation.toLowerCase()) > -1;
    }
    return data.indexOf(expectation) > -1;
}
function createUnexpectedEndError(message, remainingQueue) {
    const desc = remainingQueue.map((it) => it.description);
    const msg = `${message}\n${desc.join('\n')}`;
    return new assert_1.AssertionError({
        message: msg,
        expected: [],
        actual: desc,
    });
}
function createExpectationError(expected, actual) {
    let expectation;
    if (util_1.types.isRegExp(expected)) {
        expectation = `to match ${expected}`;
    }
    else {
        expectation = `to contain ${JSON.stringify(expected)}`;
    }
    const err = new assert_1.AssertionError({
        message: (0, util_1.format)('expected %j %s', actual, expectation),
        actual,
        expected,
    });
    return err;
}
/**
 *
 */
function nspawn(command, params = [], options = {}) {
    if (Array.isArray(command)) {
        params = command;
        command = params.shift();
    }
    else if (typeof command === 'string') {
        const parsedPath = (0, path_1.parse)(command);
        const parsedArgs = parsedPath.base.split(' ');
        command = (0, path_1.join)(parsedPath.dir, parsedArgs[0]);
        params = params || parsedArgs.slice(1);
    }
    const testingWithLatestCodebase = (0, __1.isTestingWithLatestCodebase)(command);
    if (testingWithLatestCodebase || (process.platform === 'win32' && !command.endsWith('.exe'))) {
        params.unshift(command);
        command = (0, __1.getScriptRunnerPath)(testingWithLatestCodebase);
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
    if (params.length > 0 && params.find((param) => param.toLowerCase() === 'push')) {
        pushEnv = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    // If we have an environment passed in we've to add the current process' environment, otherwised the forked
    // process would not have $PATH and others that is required to run amplify-cli successfully.
    // to be able to disable CI detection we do need to pass in a childEnv
    if (options.env || pushEnv || options.disableCIDetection === true) {
        childEnv = Object.assign(Object.assign(Object.assign(Object.assign({}, process.env), pushEnv), options.env), { NODE_OPTIONS: '--max_old_space_size=4096' });
        // Undo ci-info detection, required for some tests
        if (options.disableCIDetection === true) {
            delete childEnv.CI;
            delete childEnv.CONTINUOUS_INTEGRATION;
            delete childEnv.BUILD_NUMBER;
            delete childEnv.TRAVIS;
            delete childEnv.GITHUB_ACTIONS;
            delete childEnv.CIRCLECI;
            delete childEnv.CIRCLE_PULL_REQUEST;
        }
    }
    const context = {
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
exports.nspawn = nspawn;
//# sourceMappingURL=nexpect.js.map