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
exports.ensureAmplifyMetaFrontendConfig = exports.onCategoryOutputsChange = void 0;
const amplify_category_auth_1 = require("@aws-amplify/amplify-category-auth");
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const promise_sequential_1 = __importDefault(require("promise-sequential"));
const get_resource_outputs_1 = require("./get-resource-outputs");
const onCategoryOutputsChange = async (context, cloudAmplifyMeta, localMeta) => {
    if (!cloudAmplifyMeta) {
        cloudAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta(undefined, {
            throwIfNotExist: false,
            default: {},
        });
    }
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig();
    if (projectConfig.frontend) {
        (0, exports.ensureAmplifyMetaFrontendConfig)(localMeta);
        const frontendPlugins = context.amplify.getFrontendPlugins(context);
        const frontendHandlerModule = await Promise.resolve().then(() => __importStar(require(frontendPlugins[projectConfig.frontend])));
        await frontendHandlerModule.createFrontendConfigs(context, (0, get_resource_outputs_1.getResourceOutputs)(localMeta), (0, get_resource_outputs_1.getResourceOutputs)(cloudAmplifyMeta));
    }
    const outputChangedEventTasks = [];
    const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
    for (const category of Object.keys(categoryPluginInfoList)) {
        for (const pluginInfo of categoryPluginInfoList[category]) {
            const { packageLocation } = pluginInfo;
            const pluginModule = await Promise.resolve().then(() => __importStar(require(packageLocation)));
            if (pluginModule && typeof pluginModule.onAmplifyCategoryOutputChange === 'function') {
                outputChangedEventTasks.push(async () => {
                    try {
                        await attachContextExtensions(context, packageLocation);
                        await pluginModule.onAmplifyCategoryOutputChange(context, cloudAmplifyMeta);
                    }
                    catch (e) {
                    }
                });
            }
        }
    }
    if (outputChangedEventTasks.length > 0) {
        await (0, promise_sequential_1.default)(outputChangedEventTasks);
    }
};
exports.onCategoryOutputsChange = onCategoryOutputsChange;
const attachContextExtensions = async (context, packageLocation) => {
    const extensionsDirPath = path.normalize(path.join(packageLocation, 'extensions'));
    if (fs.existsSync(extensionsDirPath)) {
        const stats = fs.statSync(extensionsDirPath);
        if (stats.isDirectory()) {
            const itemNames = fs.readdirSync(extensionsDirPath);
            for (const itemName of itemNames) {
                const itemPath = path.join(extensionsDirPath, itemName);
                let itemModule;
                try {
                    itemModule = await Promise.resolve().then(() => __importStar(require(itemPath)));
                    itemModule(context);
                }
                catch (e) {
                }
            }
        }
    }
};
const ensureAmplifyMetaFrontendConfig = (amplifyMeta) => {
    var _a;
    var _b;
    if (!amplifyMeta) {
        amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    }
    if (!amplifyMeta.auth)
        return;
    const authResourceName = Object.keys(amplifyMeta.auth).find((key) => amplifyMeta.auth[key].service === 'Cognito');
    if (!authResourceName)
        return;
    const authParameters = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, 'auth', authResourceName);
    const frontendAuthConfig = (0, amplify_category_auth_1.getFrontendConfig)(authParameters);
    (_a = (_b = amplifyMeta.auth[authResourceName]).frontendAuthConfig) !== null && _a !== void 0 ? _a : (_b.frontendAuthConfig = {});
    const metaFrontendAuthConfig = amplifyMeta.auth[authResourceName].frontendAuthConfig;
    Object.keys(frontendAuthConfig).forEach((key) => {
        metaFrontendAuthConfig[key] = frontendAuthConfig[key];
    });
    amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
};
exports.ensureAmplifyMetaFrontendConfig = ensureAmplifyMetaFrontendConfig;
//# sourceMappingURL=on-category-outputs-change.js.map