import { PluginVerificationResult } from '@aws-amplify/amplify-cli-core';

export class AddPluginResult {
  constructor(public isAdded: boolean = false, public pluginVerificationResult?: PluginVerificationResult, public error?: AddPluginError) {}
}

export enum AddPluginError {
  FailedVerification = 'FailedVerification',
  Other = 'Other',
}
