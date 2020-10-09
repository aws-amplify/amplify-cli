import { PluginCollection } from './plugin-collection';
import { constants } from './constants';
import { IPluginPlatform } from 'amplify-cli-core';

const SECONDSINADAY = 86400;

export class PluginPlatform implements IPluginPlatform {
  constructor() {
    this.pluginDirectories = [constants.LocalNodeModules, constants.ParentDirectory, constants.GlobalNodeModules];
    this.pluginPrefixes = [constants.AmplifyPrefix];
    this.userAddedLocations = [];
    this.lastScanTime = new Date();
    this.maxScanIntervalInSeconds = SECONDSINADAY;
    this.plugins = new PluginCollection();
    this.excluded = new PluginCollection();
  }

  pluginDirectories: string[];
  pluginPrefixes: string[];
  userAddedLocations: string[];
  lastScanTime: Date;
  maxScanIntervalInSeconds: number;
  plugins: PluginCollection;
  excluded: PluginCollection;
}
