import { $TSContext, pathManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager, BuildRequest, BuildType } from 'amplify-function-plugin-interface';
import path from 'path';
import { category } from '../../../constants';
import { BuildRequestMeta } from './buildFunction';
import { ServiceName } from './constants';
import { LayerConfiguration, loadLayerConfigurationFile } from './layerConfiguration';

export const buildLayer = async (context: $TSContext, { resourceName, lastBuildTimeStamp }: BuildRequestMeta) => {
  const layerConfig: LayerConfiguration = loadLayerConfigurationFile(pathManager.getBackendDirPath(), resourceName);
  const resourcePath = path.join(pathManager.getBackendDirPath(), 'function', resourceName);
  //TODO Need to change runtime flow from array to variable since it is list
  const layerCodePath = path.join(resourcePath, 'lib', layerConfig.runtimes[0].layerExecutablePath);

  const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
    context,
    layerConfig.runtimes[0].runtimePluginId,
  )) as FunctionRuntimeLifecycleManager;

  const depCheck = await runtimePlugin.checkDependencies(layerConfig.runtimes[0].value);
  if (!depCheck.hasRequiredDependencies) {
    context.print.error(depCheck.errorMessage || `You are missing dependencies required to package ${resourceName}`);
    throw new Error(`Missing required dependencies to package ${resourceName}`);
  }

  const prevBuildTime = lastBuildTimeStamp ? new Date(lastBuildTimeStamp) : undefined;

  // build the function
  let rebuilt = false;
  // fixing build type for layers
  const buildType = BuildType.PROD;
  const buildRequest: BuildRequest = {
    buildType: buildType,
    srcRoot: layerCodePath,
    runtime: layerConfig.runtimes[0].value,
    legacyBuildHookParams: {
      projectRoot: pathManager.findProjectRoot(),
      resourceName: resourceName,
    },
    lastBuildTimeStamp: prevBuildTime,
    service: ServiceName.LambdaLayer,
  };
  rebuilt = (await runtimePlugin.build(buildRequest)).rebuilt;
  if (rebuilt) {
    context.amplify.updateamplifyMetaAfterBuild({ category, resourceName }, buildType.toString());
    return new Date().toISOString();
  } else {
    return lastBuildTimeStamp;
  }
};
