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
exports.removeGetUserEndpoints = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const pinpointTemplateFileName = 'pinpoint-cloudformation-template.json';
const removeGetUserEndpoints = (resourceName) => {
    const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
    const pinpointTemplateFilePath = path.join(projectBackendDirPath, 'analytics', resourceName, pinpointTemplateFileName);
    if (fs.existsSync(pinpointTemplateFilePath)) {
        const pinpointTemplateFile = amplify_cli_core_1.JSONUtilities.readJson(pinpointTemplateFilePath);
        const unAuthAction = lodash_1.default.get(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action');
        const authAction = lodash_1.default.get(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action');
        lodash_1.default.remove(unAuthAction, (action) => action === 'mobiletargeting:GetUserEndpoints');
        lodash_1.default.remove(authAction, (action) => action === 'mobiletargeting:GetUserEndpoints');
        lodash_1.default.setWith(pinpointTemplateFile, 'Resources.CognitoUnauthPolicy.Properties.PolicyDocument.Statement[0].Action', unAuthAction);
        lodash_1.default.setWith(pinpointTemplateFile, 'Resources.CognitoAuthPolicy.Properties.PolicyDocument.Statement[0].Action', authAction);
        amplify_cli_core_1.JSONUtilities.writeJson(pinpointTemplateFilePath, pinpointTemplateFile);
    }
};
exports.removeGetUserEndpoints = removeGetUserEndpoints;
//# sourceMappingURL=remove-pinpoint-policy.js.map