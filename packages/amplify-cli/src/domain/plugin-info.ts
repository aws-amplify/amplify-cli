import PluginManifest from './plugin-manifest';

export default class PluginInfo {
  constructor(public packageName: string, public packageVersion: string, public packageLocation: string, public manifest: PluginManifest) {}
}
