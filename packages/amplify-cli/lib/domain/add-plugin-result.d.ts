import { PluginVerificationResult } from 'amplify-cli-core';
export declare class AddPluginResult {
    isAdded: boolean;
    pluginVerificationResult?: PluginVerificationResult | undefined;
    error?: AddPluginError | undefined;
    constructor(isAdded?: boolean, pluginVerificationResult?: PluginVerificationResult | undefined, error?: AddPluginError | undefined);
}
export declare enum AddPluginError {
    FailedVerification = "FailedVerification",
    Other = "Other"
}
//# sourceMappingURL=add-plugin-result.d.ts.map