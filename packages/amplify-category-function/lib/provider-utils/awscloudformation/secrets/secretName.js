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
exports.getAppId = exports.getFunctionSecretCfnPrefix = exports.getFunctionSecretCfnName = exports.getEnvSecretPrefix = exports.getFunctionSecretPrefix = exports.getFullyQualifiedSecretName = exports.secretsPathAmplifyAppIdKey = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const cloudform_types_1 = require("cloudform-types");
const path = __importStar(require("path"));
exports.secretsPathAmplifyAppIdKey = 'secretsPathAmplifyAppId';
const getFullyQualifiedSecretName = (secretName, functionName, envName) => `${(0, exports.getFunctionSecretPrefix)(functionName, envName)}${secretName}`;
exports.getFullyQualifiedSecretName = getFullyQualifiedSecretName;
const getFunctionSecretPrefix = (functionName, envName) => path.posix.join((0, exports.getEnvSecretPrefix)(envName), `AMPLIFY_${functionName}_`);
exports.getFunctionSecretPrefix = getFunctionSecretPrefix;
const getEnvSecretPrefix = (envName) => {
    var _a;
    if (envName === void 0) { envName = (_a = amplify_cli_core_1.stateManager.getLocalEnvInfo()) === null || _a === void 0 ? void 0 : _a.envName; }
    if (!envName) {
        throw new Error('Could not determine the current Amplify environment name. Try running `amplify env checkout`.');
    }
    return path.posix.join('/amplify', (0, exports.getAppId)(), envName);
};
exports.getEnvSecretPrefix = getEnvSecretPrefix;
const getFunctionSecretCfnName = (secretName, functionName) => cloudform_types_1.Fn.Join('', [(0, exports.getFunctionSecretCfnPrefix)(functionName), secretName]);
exports.getFunctionSecretCfnName = getFunctionSecretCfnName;
const getFunctionSecretCfnPrefix = (functionName) => cloudform_types_1.Fn.Sub(path.posix.join('/amplify', '${appId}', '${env}', 'AMPLIFY_${functionName}_'), {
    appId: cloudform_types_1.Fn.Ref(exports.secretsPathAmplifyAppIdKey),
    env: cloudform_types_1.Fn.Ref('env'),
    functionName,
});
exports.getFunctionSecretCfnPrefix = getFunctionSecretCfnPrefix;
const getAppId = () => {
    var _a, _b;
    const meta = amplify_cli_core_1.stateManager.getMeta(undefined, { throwIfNotExist: false });
    const appId = (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
    if (!appId) {
        throw new Error('Could not find an Amplify AppId in the amplify-meta.json file. Make sure your project is initialized in the cloud.');
    }
    return appId;
};
exports.getAppId = getAppId;
//# sourceMappingURL=secretName.js.map