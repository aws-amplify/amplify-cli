import PluginManifest from './plugin-manifest';

export default class PluginVerificationResult {
    constructor(
        public verified: boolean = false,
        public error?: PluginVerificationError,
        public errorInfo?: any,
        public packageJson?: any,
        public manifest?: PluginManifest
    ) {}
}

export enum PluginVerificationError {
    PluginDirPathNotExist,
    InvalidNodePackage,
    MissingManifest,
    InvalidManifest,
    MissingExecuteAmplifyCommandMethod,
    MissingHandleAmplifyEventMethod
}