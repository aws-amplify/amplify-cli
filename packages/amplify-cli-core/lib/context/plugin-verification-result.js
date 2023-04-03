"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginVerificationError = exports.PluginVerificationResult = void 0;
class PluginVerificationResult {
    constructor(verified = false, error, errorInfo, packageJson, manifest) {
        this.verified = verified;
        this.error = error;
        this.errorInfo = errorInfo;
        this.packageJson = packageJson;
        this.manifest = manifest;
    }
}
exports.PluginVerificationResult = PluginVerificationResult;
var PluginVerificationError;
(function (PluginVerificationError) {
    PluginVerificationError["PluginDirPathNotExist"] = "PluginDirPathNotExist";
    PluginVerificationError["InvalidNodePackage"] = "InvalidNodePackage";
    PluginVerificationError["MissingManifest"] = "MissingManifest";
    PluginVerificationError["InvalidManifest"] = "InvalidManifest";
    PluginVerificationError["MissingExecuteAmplifyCommandMethod"] = "MissingExecuteAmplifyCommandMethod";
    PluginVerificationError["MissingHandleAmplifyEventMethod"] = "MissingHandleAmplifyEventMethod";
})(PluginVerificationError = exports.PluginVerificationError || (exports.PluginVerificationError = {}));
//# sourceMappingURL=plugin-verification-result.js.map