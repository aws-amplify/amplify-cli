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
exports.detectCognitoAttributesRequireVerificationBeforeUpdateDiff = exports.updateCognitoTrackedFiles = void 0;
const path = __importStar(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const amplify_cli_core_1 = require("amplify-cli-core");
const { readJson } = amplify_cli_core_1.JSONUtilities;
const updateCognitoTrackedFiles = async () => {
    if (await (0, exports.detectCognitoAttributesRequireVerificationBeforeUpdateDiff)()) {
        const { resourceName } = amplify_cli_core_1.stateManager.getResourceFromMeta(amplify_cli_core_1.stateManager.getMeta(), 'auth', 'Cognito', undefined, false);
        await addExtraLineToCliInputsJson(amplify_cli_core_1.pathManager.getBackendDirPath(), resourceName);
    }
};
exports.updateCognitoTrackedFiles = updateCognitoTrackedFiles;
const detectCognitoAttributesRequireVerificationBeforeUpdateDiff = async () => {
    const currentCloudBackendDir = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath();
    const localBackendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const cognitoResource = amplify_cli_core_1.stateManager.getResourceFromMeta(amplifyMeta, 'auth', 'Cognito', undefined, false);
    if (!fs_extra_1.default.existsSync(currentCloudBackendDir) || !cognitoResource) {
        return false;
    }
    const { resourceName } = cognitoResource;
    if (!fs_extra_1.default.existsSync(path.join(currentCloudBackendDir, 'auth', resourceName))) {
        return false;
    }
    const cloudBackendUserAttrUpdateSettings = await readCfnTemplateUserAttributeSettings(currentCloudBackendDir, resourceName);
    const backendUserAttrUpdateSettings = await readCfnTemplateUserAttributeSettings(localBackendDir, resourceName);
    const updateNotInCloudBackend = !(cloudBackendUserAttrUpdateSettings === null || cloudBackendUserAttrUpdateSettings === void 0 ? void 0 : cloudBackendUserAttrUpdateSettings.AttributesRequireVerificationBeforeUpdate) ||
        (cloudBackendUserAttrUpdateSettings === null || cloudBackendUserAttrUpdateSettings === void 0 ? void 0 : cloudBackendUserAttrUpdateSettings.AttributesRequireVerificationBeforeUpdate[0]) !== 'email';
    const updateInLocalBackend = (backendUserAttrUpdateSettings === null || backendUserAttrUpdateSettings === void 0 ? void 0 : backendUserAttrUpdateSettings.AttributesRequireVerificationBeforeUpdate.length) === 1 &&
        (backendUserAttrUpdateSettings === null || backendUserAttrUpdateSettings === void 0 ? void 0 : backendUserAttrUpdateSettings.AttributesRequireVerificationBeforeUpdate[0]) === 'email';
    return updateNotInCloudBackend && updateInLocalBackend;
};
exports.detectCognitoAttributesRequireVerificationBeforeUpdateDiff = detectCognitoAttributesRequireVerificationBeforeUpdateDiff;
const readCfnTemplateUserAttributeSettings = async (backendDir, resourceName) => {
    var _a, _b;
    const cfnTemplatePath = path.join(backendDir, 'auth', resourceName, 'build', `${resourceName}-cloudformation-template.json`);
    const cfnTemplate = readJson(cfnTemplatePath, { throwIfNotExist: false });
    if (!cfnTemplate) {
        return undefined;
    }
    return (_b = (_a = cfnTemplate.Resources.UserPool) === null || _a === void 0 ? void 0 : _a.Properties) === null || _b === void 0 ? void 0 : _b.UserAttributeUpdateSettings;
};
const addExtraLineToCliInputsJson = async (backendDir, resourceName) => {
    const cliInputsFile = path.join(backendDir, 'auth', resourceName, 'cli-inputs.json');
    if (fs_extra_1.default.existsSync(cliInputsFile)) {
        await fs_extra_1.default.appendFile(cliInputsFile, ' ');
    }
};
//# sourceMappingURL=update-tracked-files.js.map