import { PluginCollection } from './plugin-collection';
import { constants } from '../constants';
import { IPluginPlatform } from '../types';

const SECONDSINADAY = 86400;

export class PluginPlatform implements IPluginPlatform {
  constructor() {
    this.pluginDirectories = [constants.LOCAL_NODE_MODULES, constants.PARENT_DIRECTORY, constants.GLOBAL_NODE_MODULES];
    this.pluginPrefixes = [constants.AMPLIFY_PREFIX];
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
