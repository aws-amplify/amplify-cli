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
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeAmplifyHeadlessCommand = exports.getPermissionPolicies = exports.handleAmplifyEvent = exports.executeAmplifyCommand = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("./constants");
const addCommand = __importStar(require("./commands/geo/add"));
const updateCommand = __importStar(require("./commands/geo/update"));
const removeCommand = __importStar(require("./commands/geo/remove"));
const consoleCommand = __importStar(require("./commands/geo/console"));
const helpCommand = __importStar(require("./commands/geo/help"));
const importCommand = __importStar(require("./commands/geo/import"));
const resourceUtils_1 = require("./service-utils/resourceUtils");
const provider_controllers_1 = require("./provider-controllers");
const executeAmplifyCommand = async (context) => {
    switch (context.input.command) {
        case 'add':
            await addCommand.run(context);
            break;
        case 'update':
            await updateCommand.run(context);
            break;
        case 'remove':
            await removeCommand.run(context);
            break;
        case 'console':
            await consoleCommand.run(context);
            break;
        case 'help':
            await helpCommand.run(context);
            break;
        case 'import':
            await importCommand.run(context);
            break;
        default:
            amplify_prompts_1.printer.error(`The subcommand ${context.input.command} is not supported for ${constants_1.category} category`);
            break;
    }
};
exports.executeAmplifyCommand = executeAmplifyCommand;
const handleAmplifyEvent = async (context, args) => {
    amplify_prompts_1.printer.info(`${constants_1.category} handleAmplifyEvent to be implemented`);
    amplify_prompts_1.printer.info(`Received event args ${args}`);
};
exports.handleAmplifyEvent = handleAmplifyEvent;
const getPermissionPolicies = (context, resourceOpsMapping) => {
    var _a;
    const amplifyMeta = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a[constants_1.category];
    const permissionPolicies = [];
    const resourceAttributes = [];
    Object.keys(resourceOpsMapping).forEach((resourceName) => {
        try {
            const service = amplifyMeta[resourceName].service;
            const { policy, attributes } = (0, resourceUtils_1.getServicePermissionPolicies)(context, service, resourceName, resourceOpsMapping[resourceName]);
            if (Array.isArray(policy)) {
                permissionPolicies.push(...policy);
            }
            else {
                permissionPolicies.push(policy);
            }
            resourceAttributes.push({ resourceName, attributes, category: constants_1.category });
        }
        catch (e) {
            amplify_prompts_1.printer.error(`Could not get policies for ${constants_1.category}: ${resourceName}`);
            throw e;
        }
    });
    return { permissionPolicies, resourceAttributes };
};
exports.getPermissionPolicies = getPermissionPolicies;
const executeAmplifyHeadlessCommand = async (context, headlessPayload) => {
    context.usageData.pushHeadlessFlow(headlessPayload, context.input);
    switch (context.input.command) {
        case 'add':
            await (0, provider_controllers_1.addResourceHeadless)(context, headlessPayload);
            break;
        case 'update':
            await (0, provider_controllers_1.updateResourceHeadless)(context, headlessPayload);
            break;
        default:
            amplify_prompts_1.printer.error(`Headless mode for ${context.input.command} geo is not implemented yet`);
    }
};
exports.executeAmplifyHeadlessCommand = executeAmplifyHeadlessCommand;
//# sourceMappingURL=index.js.map