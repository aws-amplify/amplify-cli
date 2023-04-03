import { PluginManifest } from './plugin-manifest';
export declare class PluginVerificationResult {
    verified: boolean;
    error?: PluginVerificationError | undefined;
    errorInfo?: any;
    packageJson?: any;
    manifest?: PluginManifest | undefined;
    constructor(verified?: boolean, error?: PluginVerificationError | undefined, errorInfo?: any, packageJson?: any, manifest?: PluginManifest | undefined);
}
export declare enum PluginVerificationError {
    PluginDirPathNotExist = "PluginDirPathNotExist",
    InvalidNodePackage = "InvalidNodePackage",
    MissingManifest = "MissingManifest",
    InvalidManifest = "InvalidManifest",
    MissingExecuteAmplifyCommandMethod = "MissingExecuteAmplifyCommandMethod",
    MissingHandleAmplifyEventMethod = "MissingHandleAmplifyEventMethod"
}
//# sourceMappingURL=plugin-verification-result.d.ts.map