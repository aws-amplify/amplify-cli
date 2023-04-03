"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isYesFlagSet = exports.readHeadlessPayload = exports.isHeadlessCommand = void 0;
const readline_1 = __importDefault(require("readline"));
const input_params_manager_1 = require("../input-params-manager");
const headlessPayloadReadTimeoutMilliseconds = 2000;
const isHeadlessCommand = (context) => context.input.options && context.input.options.headless;
exports.isHeadlessCommand = isHeadlessCommand;
const readHeadlessPayload = async () => {
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    const id = setTimeout(() => {
        clearTimeout(id);
        rl.close();
    }, headlessPayloadReadTimeoutMilliseconds);
    return new Promise((resolve, reject) => {
        rl.on('line', (line) => resolve(line));
        rl.on('close', () => reject(new Error('No input received on stdin')));
    });
};
exports.readHeadlessPayload = readHeadlessPayload;
const isYesFlagSet = (context) => {
    var _a;
    if ((_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.inputParams) {
        return context.exeInfo.inputParams.yes;
    }
    const inputParams = (0, input_params_manager_1.normalizeInputParams)(context);
    return inputParams === null || inputParams === void 0 ? void 0 : inputParams.yes;
};
exports.isYesFlagSet = isYesFlagSet;
//# sourceMappingURL=headless-input-utils.js.map