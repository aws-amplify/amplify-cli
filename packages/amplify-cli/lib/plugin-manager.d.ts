import { PluginPlatform, PluginInfo, AmplifyEvent } from 'amplify-cli-core';
import { verifyPlugin } from './plugin-helpers/verify-plugin';
import createNewPlugin from './plugin-helpers/create-new-plugin';
import { AddPluginResult } from './domain/add-plugin-result';
export declare function getPluginPlatform(): Promise<PluginPlatform>;
export declare function getPluginsWithName(pluginPlatform: PluginPlatform, nameOrAlias: string): Array<PluginInfo>;
export declare function getPluginsWithNameAndCommand(pluginPlatform: PluginPlatform, nameOrAlias: string, command: string): Array<PluginInfo>;
export declare function getPluginsWithEventHandler(pluginPlatform: PluginPlatform, event: AmplifyEvent): Array<PluginInfo>;
export declare function getAllPluginNames(pluginPlatform: PluginPlatform): Set<string>;
export declare function scan(pluginPlatform?: PluginPlatform): Promise<PluginPlatform>;
export { verifyPlugin };
export { createNewPlugin };
export declare function confirmAndScan(pluginPlatform: PluginPlatform): Promise<void>;
export declare const addUserPluginPackage: (pluginPlatform: PluginPlatform, pluginDirPath: string) => Promise<AddPluginResult>;
export declare const addExcludedPluginPackage: (pluginPlatform: PluginPlatform, pluginInfo: PluginInfo) => Promise<AddPluginResult>;
export declare const addPluginPackage: (pluginPlatform: PluginPlatform, pluginDirPath: string) => Promise<AddPluginResult>;
export declare function removePluginPackage(pluginPlatform: PluginPlatform, pluginInfo: PluginInfo): void;
//# sourceMappingURL=plugin-manager.d.ts.map