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
exports.configureNewUser = void 0;
const inquirer = __importStar(require("inquirer"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const get_provider_plugins_1 = require("./extensions/amplify-helpers/get-provider-plugins");
async function configureNewUser(context) {
    const providerPlugins = (0, get_provider_plugins_1.getProviderPlugins)(context);
    const providerPluginNames = Object.keys(providerPlugins);
    const providerSelection = {
        type: 'checkbox',
        name: 'selectedProviders',
        message: 'Select the backend providers.',
        choices: providerPluginNames,
    };
    const selectProviders = providerPluginNames.length === 1 ? Promise.resolve({ selectedProviders: providerPluginNames }) : inquirer.prompt(providerSelection);
    const { selectedProviders } = await selectProviders;
    const configTasks = [];
    selectedProviders.forEach((providerKey) => {
        const provider = require(providerPlugins[providerKey]);
        configTasks.push(() => provider.configureNewUser(context));
    });
    await (0, promise_sequential_1.default)(configTasks);
}
exports.configureNewUser = configureNewUser;
//# sourceMappingURL=configure-new-user.js.map