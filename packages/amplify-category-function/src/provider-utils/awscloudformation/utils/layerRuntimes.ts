import { $TSAny, JSONUtilities, stateManager } from 'amplify-cli-core';
import _ from 'lodash';
import path from 'path';
import { categoryName } from './constants';
import { LayerRuntime } from './layerParams';

const runtimesFileName = 'layer-runtimes.json';

export const getLayerRuntimes = (backendDirPath: string, layerName: string) => {
  const runtimesFilePath = path.join(backendDirPath, categoryName, layerName, runtimesFileName);
  const runtimeMetaList = JSONUtilities.readJson<$TSAny>(runtimesFilePath);
  const cloudTemplateValues = stateManager.getResourceParametersJson(undefined, categoryName, layerName).runtimes || [];
  runtimeMetaList.forEach(runtimeMeta => {
    runtimeMeta.cloudTemplateValue = cloudTemplateValues.filter((ctv: string) => ctv.startsWith(runtimeMeta.value));
  });
  return runtimeMetaList;
};

export const saveLayerRuntimes = (layerDirPath: string, runtimes: LayerRuntime[]) => {
  const runtimesFilePath = path.join(layerDirPath, runtimesFileName);
  runtimes = (runtimes || []).map(runtime => _.pick(runtime, 'value', 'name', 'layerExecutablePath'));
  JSONUtilities.writeJson(runtimesFilePath, runtimes);
};

// async function loadAvailableLayerRuntimePlugins(context: $TSContext) {
//   const layerRuntimePlugins = context.pluginPlatform.plugins.functionRuntime.filter(
//     runtimePlugin => runtimePlugin.manifest.functionRuntime.conditions.services.includes(ServiceName.LambdaLayer),
//   );
//   console.log(layerRuntimePlugins);
//   const loadedPlugins = layerRuntimePlugins.map(
//     async plugin => {
//       const loadedPlugin = await loadPluginFromFactory(plugin.packageLocation, 'functionRuntimeContributorFactory', context);
//       const depCheck = await (loadedPlugin as FunctionRuntimeLifecycleManager).checkDependencies(plugin.manifest.functionRuntime.value);
//       if (!depCheck.hasRequiredDependencies) {
//         context.print.warning(
//           depCheck.errorMessage || 'Some dependencies required for building and packaging this runtime are not installed',
//         );
//       }
//       return loadedPlugin;
//     },
//   );
//   console.log(loadedPlugins);
//   return Promise.all(loadedPlugins);
// }

export function loadLayerCloudTemplateRuntimes(layerName: string): string[] {
  const { runtimes } = stateManager.getResourceParametersJson(undefined, categoryName, layerName);
  return runtimes;
}
