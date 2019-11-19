import { PluginInfo } from '../domain/plugin-info';

export function twoPluginsAreTheSame(plugin0: PluginInfo, plugin1: PluginInfo) {
  if (plugin0.packageLocation === plugin1.packageLocation) {
    return true;
  }

  if (plugin0.packageName === plugin1.packageName && plugin0.packageVersion === plugin1.packageVersion) {
    return true;
  }

  return false;
}
