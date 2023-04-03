"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const circusRunner = require('jest-circus/runner');
const throat = require('throat');
const { v4: uuid } = require('uuid');
const mutex = throat(1);
const run = (globalConfig, config, environment, runtime, testPath) => __awaiter(void 0, void 0, void 0, function* () {
    const CLITestRunner = {};
    environment.global.addCLITestRunnerLogs = (logs) => {
        CLITestRunner.logs = logs;
    };
    environment.global.getRandomId = () => mutex(() => uuid().split('-')[0]);
    const result = yield circusRunner(globalConfig, config, environment, runtime, testPath);
    setTimeout(() => {
        if (process.platform === 'win32') {
            // An issue with node-pty leaves open handles when running within jest
            // This prevents the jest process from exiting without being forced.
            // Exiting here as a workaround, only on windows.
            // A timeout is used to give Jest time to render the list of passed/failed tests.
            // See https://github.com/microsoft/node-pty/issues/437
            process.exit(result.numFailingTests !== 0);
        }
    }, 1000);
    result.CLITestRunner = CLITestRunner;
    return result;
});
exports.run = run;
module.exports = exports.run;
//# sourceMappingURL=cli-test-runner.js.map