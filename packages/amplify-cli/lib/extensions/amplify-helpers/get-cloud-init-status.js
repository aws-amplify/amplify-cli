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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudInitStatus = exports.NON_AMPLIFY_PROJECT = exports.CLOUD_NOT_INITIALIZED = exports.CLOUD_INITIALIZED = void 0;
const fs = __importStar(require("fs-extra"));
const amplify_cli_core_1 = require("amplify-cli-core");
exports.CLOUD_INITIALIZED = 'CLOUD_INITIALIZED';
exports.CLOUD_NOT_INITIALIZED = 'CLOUD_NOT_INITIALIZED';
exports.NON_AMPLIFY_PROJECT = 'NON_AMPLIFY_PROJECT';
function getCloudInitStatus() {
    const amplifyMetaPath = amplify_cli_core_1.pathManager.getAmplifyMetaFilePath();
    const backendConfigPath = amplify_cli_core_1.pathManager.getBackendConfigFilePath();
    if (fs.existsSync(amplifyMetaPath)) {
        return exports.CLOUD_INITIALIZED;
    }
    if (fs.existsSync(backendConfigPath)) {
        return exports.CLOUD_NOT_INITIALIZED;
    }
    return exports.NON_AMPLIFY_PROJECT;
}
exports.getCloudInitStatus = getCloudInitStatus;
//# sourceMappingURL=get-cloud-init-status.js.map