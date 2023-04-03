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
exports.timeConstrainedInvoker = exports.start = void 0;
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const path = __importStar(require("path"));
const inquirer = __importStar(require("inquirer"));
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const amplify_function_plugin_interface_1 = require("@aws-amplify/amplify-function-plugin-interface");
const load_lambda_config_1 = require("../utils/lambda/load-lambda-config");
const DEFAULT_TIMEOUT_SECONDS = 10;
async function start(context) {
    var _a, _b;
    const ampMeta = amplify_cli_core_1.stateManager.getMeta();
    let resourceName = (_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.subCommands) === null || _b === void 0 ? void 0 : _b[0];
    if (!resourceName) {
        const choices = lodash_1.default.keys(lodash_1.default.get(ampMeta, ['function'])).filter((resourceName) => (0, amplify_category_function_1.isMockable)(context, resourceName).isMockable);
        if (choices.length < 1) {
            throw new Error('There are no mockable functions in the project. Use `amplify add function` to create one.');
        }
        else if (choices.length == 1) {
            resourceName = choices[0];
        }
        else {
            const resourceNameQuestion = [
                {
                    type: 'list',
                    name: 'resourceName',
                    message: 'Select the function to mock',
                    choices,
                },
            ];
            ({ resourceName } = await inquirer.prompt(resourceNameQuestion));
        }
    }
    else {
        const mockable = (0, amplify_category_function_1.isMockable)(context, resourceName);
        if (!mockable.isMockable) {
            throw new Error(`Unable to mock ${resourceName}. ${mockable.reason}`);
        }
    }
    const event = await resolveEvent(context, resourceName);
    const lambdaConfig = await (0, load_lambda_config_1.loadLambdaConfig)(context, resourceName);
    if (!(lambdaConfig === null || lambdaConfig === void 0 ? void 0 : lambdaConfig.handler)) {
        throw new Error(`Could not parse handler for ${resourceName} from cloudformation file`);
    }
    context.print.blue('Ensuring latest function changes are built...');
    await (0, amplify_category_function_1.getBuilder)(context, resourceName, amplify_function_plugin_interface_1.BuildType.DEV)();
    const invoker = await (0, amplify_category_function_1.getInvoker)(context, { resourceName, handler: lambdaConfig.handler, envVars: lambdaConfig.environment });
    context.print.blue('Starting execution...');
    try {
        const result = await (0, exports.timeConstrainedInvoker)(invoker({ event }), context.input.options);
        const stringResult = typeof result === 'object' ? JSON.stringify(result, undefined, 2) : typeof result === 'undefined' ? 'undefined' : result;
        context.print.success('Result:');
        context.print.info(typeof result === 'undefined' ? '' : stringResult);
    }
    catch (err) {
        context.print.error(`${resourceName} failed with the following error:`);
        context.print.info(err);
    }
    finally {
        context.print.blue('Finished execution.');
    }
}
exports.start = start;
const timeConstrainedInvoker = async (promise, options) => {
    const { timer, cancel } = getCancellableTimer(options);
    try {
        return await Promise.race([promise, timer]);
    }
    finally {
        cancel();
    }
};
exports.timeConstrainedInvoker = timeConstrainedInvoker;
const getCancellableTimer = ({ timeout } = {}) => {
    const inputTimeout = Number.parseInt(timeout, 10);
    const lambdaTimeoutSeconds = !!inputTimeout && inputTimeout > 0 ? inputTimeout : DEFAULT_TIMEOUT_SECONDS;
    const timeoutErrorMessage = `Lambda execution timed out after ${lambdaTimeoutSeconds} seconds. Press ctrl + C to exit the process.
    To increase the lambda timeout use the --timeout parameter to set a value in seconds.
    Note that the maximum Lambda execution time is 15 minutes:
    https://aws.amazon.com/about-aws/whats-new/2018/10/aws-lambda-supports-functions-that-can-run-up-to-15-minutes/\n`;
    let timeoutObj;
    const timer = new Promise((_, reject) => {
        timeoutObj = setTimeout(() => reject(new Error(timeoutErrorMessage)), lambdaTimeoutSeconds * 1000);
    });
    const cancel = () => clearTimeout(timeoutObj);
    return { timer, cancel };
};
const resolveEvent = async (context, resourceName) => {
    var _a;
    const { amplify } = context;
    const resourcePath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_category_function_1.category, resourceName);
    const eventNameValidator = amplify.inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9/._-]+?\\.json$',
        onErrorMsg: 'Provide a valid unix-like path to a .json file',
        required: true,
    });
    let eventName = (_a = context.input.options) === null || _a === void 0 ? void 0 : _a.event;
    let promptForEvent = true;
    if (eventName) {
        const validatorOutput = eventNameValidator(eventName);
        const isValid = typeof validatorOutput !== 'string';
        if (!isValid) {
            context.print.warning(validatorOutput);
        }
        else {
            promptForEvent = false;
        }
    }
    if (promptForEvent) {
        const eventNameQuestion = [
            {
                type: 'input',
                name: 'eventName',
                message: `Provide the path to the event JSON object relative to ${resourcePath}`,
                validate: eventNameValidator,
                default: 'src/event.json',
            },
        ];
        const resourceAnswers = await inquirer.prompt(eventNameQuestion);
        eventName = resourceAnswers.eventName;
    }
    return amplify_cli_core_1.JSONUtilities.readJson(path.resolve(path.join(resourcePath, eventName)));
};
//# sourceMappingURL=index.js.map