import { $TSAny, IPluginPlatform, CommandLineInput } from 'amplify-cli-core';
import { Context } from './domain/context';
export declare const constructContext: (pluginPlatform: IPluginPlatform, input: CommandLineInput) => Context;
export declare const isHeadlessCommand: (context: $TSAny) => boolean;
export declare const attachUsageData: (context: Context, processStartTimeStamp: number) => Promise<void>;
//# sourceMappingURL=context-manager.d.ts.map