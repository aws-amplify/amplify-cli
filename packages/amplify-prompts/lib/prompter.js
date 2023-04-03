"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.byValue = exports.byValues = exports.prompter = void 0;
const enquirer_1 = require("enquirer");
const actions = __importStar(require("enquirer/lib/combos"));
const chalk_1 = __importDefault(require("chalk"));
const flags_1 = require("./flags");
const printer_1 = require("./printer");
const stopwatch_1 = require("./stopwatch");
class AmplifyPrompter {
    constructor(prompter = enquirer_1.prompt, print = printer_1.printer) {
        this.prompter = prompter;
        this.print = print;
        this.throwLoggedError = (message, errorMsg) => {
            var _a;
            (_a = this.flowData) === null || _a === void 0 ? void 0 : _a.pushInteractiveFlow(message, errorMsg);
            throw new Error(errorMsg);
        };
        this.setFlowData = (flowData) => {
            this.flowData = flowData;
        };
        this.pushInteractiveFlow = (promptString, input, redact = false) => {
            if (flags_1.isInteractiveShell) {
                if (this.flowData && input) {
                    const finalInput = redact ? '*'.repeat(input.length) : input;
                    this.flowData.pushInteractiveFlow(promptString, finalInput);
                }
            }
        };
        this.confirmContinue = async (message = 'Do you want to continue?') => {
            let result = false;
            if (flags_1.isYes) {
                result = true;
            }
            else {
                result = await this.yesOrNoCommon(message, false);
            }
            return result;
        };
        this.yesOrNo = async (message, initial = true) => {
            let result = false;
            if (flags_1.isYes) {
                result = initial;
            }
            else {
                result = await this.yesOrNoCommon(message, initial);
            }
            return result;
        };
        this.yesOrNoCommon = async (message, initial) => {
            let submitted = false;
            this.stopWatch.start();
            const { result } = await this.prompter({
                type: 'confirm',
                name: 'result',
                message,
                format: (value) => (submitted ? (value ? 'yes' : 'no') : ''),
                onSubmit: () => {
                    submitted = true;
                    return true;
                },
                initial,
            });
            this.stopWatch.pause();
            this.pushInteractiveFlow(message, result);
            return result;
        };
        this.input = async (message, ...options) => {
            var _a;
            const opts = (_a = options === null || options === void 0 ? void 0 : options[0]) !== null && _a !== void 0 ? _a : {};
            const enquirerPromptType = 'hidden' in opts && opts.hidden
                ? EnquirerPromptType.INVISIBLE
                : opts.returnSize === 'many'
                    ? EnquirerPromptType.LIST
                    : EnquirerPromptType.INPUT;
            if (flags_1.isYes) {
                if (opts.initial !== undefined) {
                    this.pushInteractiveFlow(message, opts.initial, enquirerPromptType === EnquirerPromptType.INVISIBLE);
                    return opts.initial;
                }
                this.throwLoggedError(message, `Cannot prompt for [${message}] when '--yes' flag is set`);
            }
            const validator = (opts.returnSize === 'many' ? validateEachWith(opts.validate) : opts.validate);
            this.stopWatch.start();
            const { result } = await this.prompter({
                type: enquirerPromptType,
                name: 'result',
                message,
                validate: validator,
                initial: opts.initial,
                footer: opts.returnSize === 'many' ? 'Enter a comma-delimited list of values' : undefined,
            });
            this.stopWatch.pause();
            if (typeof opts.transform === 'function') {
                let functionResult;
                if (Array.isArray(result)) {
                    functionResult = (await Promise.all(result.map(async (part) => opts.transform(part))));
                }
                else {
                    functionResult = opts.transform(result);
                }
                this.pushInteractiveFlow(message, functionResult, enquirerPromptType == EnquirerPromptType.INVISIBLE);
                return functionResult;
            }
            this.pushInteractiveFlow(message, result, enquirerPromptType == EnquirerPromptType.INVISIBLE);
            return result;
        };
        this.pick = async (message, choices, ...options) => {
            if (!(choices === null || choices === void 0 ? void 0 : choices.length)) {
                this.throwLoggedError(message, `No choices provided for prompt [${message}]`);
            }
            const opts = (options === null || options === void 0 ? void 0 : options[0]) || {};
            const genericChoices = typeof choices[0] === 'string'
                ?
                    choices.map((choice) => ({ name: choice, value: choice }))
                : choices;
            const initialIndexes = initialOptsToIndexes(genericChoices.map((choice) => choice.value), opts.initial);
            const choiceValueMap = new Map();
            const enquirerChoices = genericChoices.map((choice) => {
                choiceValueMap.set(choice.name, choice.value);
                const enqResult = { name: choice.name, disabled: choice.disabled, hint: choice.hint };
                return enqResult;
            });
            actions.ctrl.a = 'a';
            let result = genericChoices[0].name;
            this.stopWatch.start();
            if (choices.length === 1 && opts.returnSize !== 'many') {
                this.print.info(`Only one option for [${message}]. Selecting [${result}].`);
            }
            else if ('pickAtLeast' in opts && (opts.pickAtLeast || 0) >= choices.length) {
                result = genericChoices.map((choice) => choice.name);
                this.print.info(`Must pick at least ${opts.pickAtLeast} of ${choices.length} options. Selecting all options [${result}]`);
            }
            else if (flags_1.isYes) {
                if (initialIndexes === undefined || (Array.isArray(initialIndexes) && initialIndexes.length === 0)) {
                    throw new Error(`Cannot prompt for [${message}] when '--yes' flag is set`);
                }
                if (typeof initialIndexes === 'number') {
                    result = genericChoices[initialIndexes].name;
                }
                else {
                    result = initialIndexes.map((idx) => genericChoices[idx].name);
                }
            }
            else {
                const sigTstpListener = () => process.exit();
                process.once('SIGTSTP', sigTstpListener);
                ({ result } = await this.prompter({
                    limit: 10,
                    actions,
                    footer: opts.returnSize === 'many' ? chalk_1.default.gray('(Use <space> to select, <ctrl + a> to toggle all)') : undefined,
                    type: 'autocomplete',
                    name: 'result',
                    message,
                    hint: '(Use arrow keys or type to filter)',
                    initial: initialIndexes,
                    multiple: opts.returnSize === 'many',
                    choices: enquirerChoices,
                    pointer(_, i) {
                        return this.state.index === i ? chalk_1.default.cyan('❯') : ' ';
                    },
                    indicator(_, choice) {
                        return choice.enabled ? chalk_1.default.cyan('●') : '○';
                    },
                    validate() {
                        var _a, _b;
                        if (opts && ('pickAtLeast' in opts || 'pickAtMost' in opts)) {
                            if (this.selected.length < ((_a = opts.pickAtLeast) !== null && _a !== void 0 ? _a : 0)) {
                                return `Select at least ${opts.pickAtLeast} items`;
                            }
                            if (this.selected.length > ((_b = opts.pickAtMost) !== null && _b !== void 0 ? _b : Number.POSITIVE_INFINITY)) {
                                return `Select at most ${opts.pickAtMost} items`;
                            }
                        }
                        return true;
                    },
                }));
                process.removeListener('SIGTSTP', sigTstpListener);
            }
            let loggedRet;
            if (Array.isArray(result)) {
                loggedRet = result.map((item) => choiceValueMap.get(item));
            }
            else {
                loggedRet = choiceValueMap.get(result);
            }
            this.stopWatch.pause();
            this.pushInteractiveFlow(message, loggedRet);
            return loggedRet;
        };
        this.getTotalPromptElapsedTime = () => this.stopWatch.getElapsedMilliseconds();
        const prompterShim = ((opts) => {
            if (flags_1.isInteractiveShell) {
                return prompter(opts);
            }
            throw new Error(`Cannot prompt for [${opts.message}] in a non-interactive shell`);
        });
        this.prompter = prompterShim;
        this.stopWatch = new stopwatch_1.Stopwatch();
    }
}
exports.prompter = new AmplifyPrompter();
const byValues = (selection, equals = defaultEquals) => (choices) => selection.map((sel) => choices.findIndex((choice) => equals(choice, sel))).filter((idx) => idx >= 0);
exports.byValues = byValues;
const byValue = (selection, equals = defaultEquals) => (choices) => {
    const idx = choices.findIndex((choice) => equals(choice, selection));
    return idx < 0 ? undefined : idx;
};
exports.byValue = byValue;
const validateEachWith = (validator) => async (input) => {
    if (!validator) {
        return true;
    }
    const validationList = await Promise.all(input.map((part) => part.trim()).map(async (part) => ({ part, result: await validator(part) })));
    const firstInvalid = validationList.find((v) => typeof v.result === 'string');
    if (firstInvalid) {
        return `${firstInvalid.part} did not satisfy requirement ${firstInvalid.result}`;
    }
    return true;
};
const initialOptsToIndexes = (values, initial) => {
    if (initial === undefined || typeof initial === 'number' || Array.isArray(initial)) {
        return initial;
    }
    return initial(values);
};
const defaultEquals = (a, b) => a === b;
var EnquirerPromptType;
(function (EnquirerPromptType) {
    EnquirerPromptType["INVISIBLE"] = "invisible";
    EnquirerPromptType["LIST"] = "list";
    EnquirerPromptType["INPUT"] = "input";
})(EnquirerPromptType || (EnquirerPromptType = {}));
//# sourceMappingURL=prompter.js.map