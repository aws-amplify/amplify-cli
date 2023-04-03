import { IPluginInfo } from '../types';
import { PluginManifest } from './plugin-manifest';
export declare class PluginInfo implements IPluginInfo {
    packageName: string;
    packageVersion: string;
    packageLocation: string;
    manifest: PluginManifest;
    constructor(packageName: string, packageVersion: string, packageLocation: string, manifest: PluginManifest);
}
//# sourceMappingURL=plugin-info.d.ts.map