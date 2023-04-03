import { Context } from '../domain/context';
import { PluginInfo, PluginCollection, PluginPlatform } from 'amplify-cli-core';
export declare function displaySimpleString(context: Context, title: string, contents: string, indentation?: number): void;
export declare function displayStringArray(context: Context, title: string, contents: string[], indentation?: number): void;
export declare function displayPluginDirectories(context: Context, pluginPlatform: PluginPlatform): void;
export declare function displayPrefixes(context: Context, pluginPlatform: PluginPlatform): void;
export declare function displayScanInterval(context: Context, pluginPlatform: PluginPlatform): void;
export declare function displayConfiguration(context: Context, pluginPlatform: PluginPlatform): void;
export declare function displayGeneralInfo(context: Context, pluginPlatform: PluginPlatform): void;
export declare function displayPluginPlatform(context: Context, pluginPlatform: PluginPlatform): void;
export declare function displayPluginCollection(context: Context, pluginCollection: PluginCollection, group?: string): void;
export declare function displayPluginInfoArray(context: Context, pluginInfoArray: Array<PluginInfo>, group?: string): void;
export declare function displayPluginInfo(context: Context, pluginInfo: PluginInfo, group?: string): void;
export declare function createIndentation(spaceCount: number): string;
//# sourceMappingURL=display-plugin-platform.d.ts.map