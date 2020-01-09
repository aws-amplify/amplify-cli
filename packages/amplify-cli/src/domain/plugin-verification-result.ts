import { PluginManifest } from './plugin-manifest';

export class PluginVerificationResult {
  constructor(
    public verified: boolean = false,
    public error?: PluginVerificationError,
    public errorInfo?: any,
    public packageJson?: any,
    public manifest?: PluginManifest
  ) {}
}

export enum PluginVerificationError {
  PluginDirPathNotExist = 'PluginDirPathNotExist',
  InvalidNodePackage = 'InvalidNodePackage',
  MissingManifest = 'MissingManifest',
  InvalidManifest = 'InvalidManifest',
  MissingExecuteAmplifyCommandMethod = 'MissingExecuteAmplifyCommandMethod',
  MissingHandleAmplifyEventMethod = 'MissingHandleAmplifyEventMethod',
}
