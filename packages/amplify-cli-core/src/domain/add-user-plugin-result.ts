import PluginManifest from './plugin-manifest';
import PluginVerificationResult from './plugin-verification-result';

export default class AddUserPluginResult {
    constructor(
        public isAdded: boolean = false,
        public error?: AddUserPluginError,
        public verificationResult?: PluginVerificationResult
    ) {}
}

export enum AddUserPluginError {
    DirPathNotExist,
    FailedVerification,
    PluginAlreadyAdded
}