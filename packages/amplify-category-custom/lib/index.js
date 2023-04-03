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
exports.transformCategoryStack = exports.handleAmplifyEvent = exports.executeAmplifyCommand = exports.addCDKResourceDependency = exports.generateDependentResourcesType = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path = __importStar(require("path"));
const build_custom_resources_1 = require("./utils/build-custom-resources");
const constants_1 = require("./utils/constants");
var build_custom_resources_2 = require("./utils/build-custom-resources");
Object.defineProperty(exports, "generateDependentResourcesType", { enumerable: true, get: function () { return build_custom_resources_2.generateDependentResourcesType; } });
var dependency_management_utils_1 = require("./utils/dependency-management-utils");
Object.defineProperty(exports, "addCDKResourceDependency", { enumerable: true, get: function () { return dependency_management_utils_1.addCDKResourceDependency; } });
const executeAmplifyCommand = async (context) => {
    var _a;
    let commandPath = path.normalize(path.join(__dirname, 'commands'));
    if (context.input.command === 'help') {
        commandPath = path.join(commandPath, constants_1.categoryName);
    }
    else {
        commandPath = path.join(commandPath, constants_1.categoryName, context.input.command);
    }
    const commandModule = await (_a = commandPath, Promise.resolve().then(() => __importStar(require(_a))));
    if (!amplify_cli_core_1.stateManager.metaFileExists()) {
        throw new amplify_cli_core_1.AmplifyError('MissingAmplifyMetaFileError', {
            message: 'Could not find the amplify-meta.json file.',
            resolution: 'Make sure your project is initialized in the cloud.',
        });
    }
    await commandModule.run(context);
};
exports.executeAmplifyCommand = executeAmplifyCommand;
const handleAmplifyEvent = async (__context, args) => {
    amplify_prompts_1.printer.info(`${constants_1.categoryName} handleAmplifyEvent to be implemented`);
    amplify_prompts_1.printer.info(`Received event args ${args}`);
};
exports.handleAmplifyEvent = handleAmplifyEvent;
const transformCategoryStack = async (context, resource) => {
    await (0, build_custom_resources_1.buildCustomResources)(context, resource.resourceName);
};
exports.transformCategoryStack = transformCategoryStack;
//# sourceMappingURL=index.js.map