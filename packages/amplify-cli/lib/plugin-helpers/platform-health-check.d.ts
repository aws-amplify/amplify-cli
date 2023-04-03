import { PluginPlatform } from 'amplify-cli-core';
export declare type PluginDescription = {
    name: string;
    type: string;
    packageName: string;
    packageVersion?: string;
};
export declare function checkPlatformHealth(pluginPlatform: PluginPlatform): Promise<boolean>;
export declare function getOfficialPlugins(): {
    [key: string]: PluginDescription | Array<PluginDescription>;
};
//# sourceMappingURL=platform-health-check.d.ts.map