"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPluginError = exports.AddPluginResult = void 0;
class AddPluginResult {
    constructor(isAdded = false, pluginVerificationResult, error) {
        this.isAdded = isAdded;
        this.pluginVerificationResult = pluginVerificationResult;
        this.error = error;
    }
}
exports.AddPluginResult = AddPluginResult;
var AddPluginError;
(function (AddPluginError) {
    AddPluginError["FailedVerification"] = "FailedVerification";
    AddPluginError["Other"] = "Other";
})(AddPluginError = exports.AddPluginError || (exports.AddPluginError = {}));
//# sourceMappingURL=add-plugin-result.js.map