import PluginCollection from './plugin-collection';
import constants from './constants';

export default class PluginPlatform {
    constructor() {
        this.pluginDirectories = [
            // constants.LocalNodeModules,
            constants.ParentDirectory,
            // constants.GlobalNodeModules
        ];
        this.pluginPrefixes = [
            constants.Amplify + '-'
        ];
        this.userAddedLocations = [];
        this.lastScanTime = new Date();
        this.maxScanIntervalInSeconds = 86400;
        this.plugins = new PluginCollection();
        this.excluded = new PluginCollection();
        // this.aliasMappings = new PluginCollection();
    };

    pluginDirectories: string[];
    pluginPrefixes: string[];
    userAddedLocations: string[];
    lastScanTime: Date;
    maxScanIntervalInSeconds: number;
    plugins: PluginCollection;
    excluded: PluginCollection;
    // aliasMappings: PluginCollection;
}