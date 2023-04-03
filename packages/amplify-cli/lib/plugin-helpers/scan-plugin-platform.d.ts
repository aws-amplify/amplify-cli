import { PluginPlatform } from 'amplify-cli-core';
export declare function scanPluginPlatform(pluginPlatform?: PluginPlatform): Promise<PluginPlatform>;
export declare function getCorePluginDirPath(): string;
export declare function getCorePluginVersion(): string;
export declare function normalizePluginDirectory(directory: string): string;
export declare function isUnderScanCoverageSync(pluginPlatform: PluginPlatform, pluginDirPath: string): boolean;
//# sourceMappingURL=scan-plugin-platform.d.ts.map