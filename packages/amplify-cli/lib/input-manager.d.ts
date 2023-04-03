import { PluginPlatform } from 'amplify-cli-core';
import { InputVerificationResult } from './domain/input-verification-result';
import { CLIInput } from './domain/command-input';
export declare function getCommandLineInput(pluginPlatform: PluginPlatform): CLIInput;
export declare function verifyInput(pluginPlatform: PluginPlatform, input: CLIInput): InputVerificationResult;
//# sourceMappingURL=input-manager.d.ts.map