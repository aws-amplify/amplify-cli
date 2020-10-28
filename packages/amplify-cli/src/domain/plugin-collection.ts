import { IPluginCollection } from 'amplify-cli-core';
import { PluginInfo } from './plugin-info';

export class PluginCollection implements IPluginCollection {
  [key: string]: Array<PluginInfo>;
}
