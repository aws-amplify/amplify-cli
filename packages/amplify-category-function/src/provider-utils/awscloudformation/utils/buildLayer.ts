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

  const { runtimes } = layerConfig;
  let rebuilt = false;

  for (const runtime of runtimes) {
    const layerCodePath = path.join(resourcePath, 'lib', runtime.layerExecutablePath);

    const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
      context,
      runtime.runtimePluginId,
    )) as FunctionRuntimeLifecycleManager;

    const depCheck = await runtimePlugin.checkDependencies(runtime.value);
    if (!depCheck.hasRequiredDependencies) {
      context.print.error(depCheck.errorMessage || `Required dependencies to build ${resourceName} are missing`);
      const err = new Error(`Required dependencies to build ${resourceName} are missing`);
      err.stack = undefined;
      throw err;
    }

    const prevBuildTimestamp = lastBuildTimestamp ? new Date(lastBuildTimestamp) : undefined;

    // fixing build type for layers
    const buildRequest: BuildRequest = {
      buildType: BuildType.PROD,
      srcRoot: layerCodePath,
      runtime: runtime.value,
      legacyBuildHookParams: {
        projectRoot: pathManager.findProjectRoot(),
        resourceName: resourceName,
      },
      lastBuildTimeStamp: prevBuildTimestamp,
      service: ServiceName.LambdaLayer,
    };
    ({ rebuilt } = await runtimePlugin.build(buildRequest));
  }

  if (rebuilt) {
    context.amplify.updateamplifyMetaAfterBuild({ category: categoryName, resourceName }, BuildType.PROD.toString());
    return new Date();
  } else {
    return lastBuildTimestamp;
  }
};
