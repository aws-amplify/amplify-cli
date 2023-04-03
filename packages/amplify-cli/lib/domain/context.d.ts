import { CommandLineInput, IPluginPlatform, IUsageData } from 'amplify-cli-core';
import { AmplifyToolkit } from './amplify-toolkit';
export declare class Context {
    pluginPlatform: IPluginPlatform;
    input: CommandLineInput;
    amplify: AmplifyToolkit;
    usageData: IUsageData;
    constructor(pluginPlatform: IPluginPlatform, input: CommandLineInput);
    [key: string]: any;
}
//# sourceMappingURL=context.d.ts.map