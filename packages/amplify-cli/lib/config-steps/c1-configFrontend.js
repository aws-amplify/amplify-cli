"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.configFrontendHandler = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const get_frontend_plugins_1 = require("../extensions/amplify-helpers/get-frontend-plugins");
const input_params_manager_1 = require("../input-params-manager");
async function configFrontendHandler(context) {
    const frontendPlugins = (0, get_frontend_plugins_1.getFrontendPlugins)(context);
    const { frontend } = context.exeInfo.projectConfig;
    const selectedFrontend = await selectFrontendHandler(context, frontendPlugins, frontend);
    if (selectedFrontend !== frontend) {
        delete context.exeInfo.projectConfig[frontend];
        const frontendModule = await Promise.resolve().then(() => __importStar(require(frontendPlugins[selectedFrontend])));
        await frontendModule.init(context);
        context.exeInfo.projectConfig.frontend = selectedFrontend;
    }
    else {
        const frontendModule = await Promise.resolve().then(() => __importStar(require(frontendPlugins[selectedFrontend])));
        await frontendModule.configure(context);
    }
    return context;
}
exports.configFrontendHandler = configFrontendHandler;
async function selectFrontendHandler(context, frontendPlugins, currentFrontend) {
    let frontend;
    const frontendPluginList = Object.keys(frontendPlugins);
    const { inputParams } = context.exeInfo;
    if (inputParams.amplify.frontend) {
        frontend = (0, input_params_manager_1.normalizeFrontendHandlerName)(inputParams.amplify.frontend, frontendPluginList);
    }
    if (!frontend && inputParams.yes) {
        frontend = 'javascript';
    }
    if (!frontend) {
        const selectFrontend = {
            type: 'list',
            name: 'selectedFrontend',
            message: "Choose the type of app that you're building",
            choices: Object.keys(frontendPlugins),
            default: currentFrontend,
        };
        const answer = await inquirer_1.default.prompt(selectFrontend);
        frontend = answer.selectedFrontend;
    }
    return frontend;
}
//# sourceMappingURL=c1-configFrontend.js.map