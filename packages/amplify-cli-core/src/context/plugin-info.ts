import { IPluginInfo } from '../types';
import { PluginManifest } from './plugin-manifest';

export class PluginInfo implements IPluginInfo {
  constructor(public packageName: string, public packageVersion: string, public packageLocation: string, public manifest: PluginManifest) {}
}
