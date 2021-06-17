import { $TSContext, pathManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager, BuildRequest, BuildType } from 'amplify-function-plugin-interface';
import * as path from 'path';
import { categoryName } from '../../../constants';
import { BuildRequestMeta } from './buildFunction';
import { ServiceName } from './constants';
import { LayerConfiguration, loadLayerConfigurationFile } from './layerConfiguration';

export const buildLayer = async (context: $TSContext, { resourceName, lastBuildTimestamp }: BuildRequestMeta) => {
  const layerConfig: LayerConfiguration = loadLayerConfigurationFile(resourceName);
  const resourcePath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);

  const layerCodePath = path.join(resourcePath, 'lib', layerConfig.runtimes[0].layerExecutablePath);

  const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
    context,
    layerConfig.runtimes[0].runtimePluginId,
  )) as FunctionRuntimeLifecycleManager;

  const depCheck = await runtimePlugin.checkDependencies(layerConfig.runtimes[0].value);
  if (!depCheck.hasRequiredDependencies) {
    context.print.error(depCheck.errorMessage || `Required dependencies to build ${resourceName} are missing`);
    const err = new Error(`Required dependencies to build ${resourceName} are missing`);
    err.stack = undefined;
    throw err;
  }

  const prevBuildTimestamp = lastBuildTimestamp ? new Date(lastBuildTimestamp) : undefined;

  // build the function
  let rebuilt = false;

  // fixing build type for layers
  const buildRequest: BuildRequest = {
    buildType: BuildType.PROD,
    srcRoot: layerCodePath,
    runtime: layerConfig.runtimes[0].value,
    legacyBuildHookParams: {
      projectRoot: pathManager.findProjectRoot(),
      resourceName: resourceName,
    },
    lastBuildTimeStamp: prevBuildTimestamp,
    service: ServiceName.LambdaLayer,
  };
  rebuilt = (await runtimePlugin.build(buildRequest)).rebuilt;
  if (rebuilt) {
    context.amplify.updateamplifyMetaAfterBuild({ category: categoryName, resourceName }, BuildType.PROD.toString());
    return new Date();
  } else {
    return lastBuildTimestamp;
  }
};
