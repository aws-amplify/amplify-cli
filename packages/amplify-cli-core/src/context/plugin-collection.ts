import { IPluginCollection } from '../types';
import { PluginInfo } from './plugin-info';

export class PluginCollection implements IPluginCollection {
  [key: string]: Array<PluginInfo>;
}
