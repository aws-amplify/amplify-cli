import { PluginVerificationResult } from 'amplify-cli-core';
export declare function verifyPlugin(pluginDirPath: string): Promise<PluginVerificationResult>;
export declare type PluginNameValidationResult = {
    isValid: boolean;
    message?: string;
};
export declare function validPluginName(pluginName: string): Promise<PluginNameValidationResult>;
//# sourceMappingURL=verify-plugin.d.ts.map