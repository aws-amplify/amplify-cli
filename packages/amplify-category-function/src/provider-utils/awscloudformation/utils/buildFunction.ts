import { $TSContext, pathManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager, BuildRequest, BuildType } from 'amplify-function-plugin-interface';
import { ResourceMeta } from '../types/packaging-types';
import * as path from 'path';

export const buildFunction = async (context: $TSContext, resource: ResourceMeta, buildType: BuildType = BuildType.PROD) => {
  const resourcePath = path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName);
  const breadcrumbs = context.amplify.readBreadcrumbs(resource.category, resource.resourceName);

  const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
    context,
    breadcrumbs.pluginId,
  )) as FunctionRuntimeLifecycleManager;

  const depCheck = await runtimePlugin.checkDependencies(breadcrumbs.functionRuntime);
  if (!depCheck.hasRequiredDependencies) {
    context.print.error(depCheck.errorMessage || `You are missing dependencies required to package ${resource.resourceName}`);
    throw new Error(`Missing required dependencies to package ${resource.resourceName}`);
  }

  const prevBuildTime = resource.lastBuildTimeStamp ? new Date(resource.lastBuildTimeStamp) : undefined;

  // build the function
  let rebuilt = false;
  if (breadcrumbs.scripts && breadcrumbs.scripts.build) {
    // TODO
    throw new Error('Executing custom build scripts is not yet implemented');
  } else {
    const buildRequest: BuildRequest = {
      buildType,
      srcRoot: resourcePath,
      runtime: breadcrumbs.functionRuntime,
      legacyBuildHookParams: {
        projectRoot: pathManager.findProjectRoot(),
        resourceName: resource.resourceName,
      },
      lastBuildTimeStamp: prevBuildTime,
    };
    rebuilt = (await runtimePlugin.build(buildRequest)).rebuilt;
  }
  if (rebuilt) {
    context.amplify.updateamplifyMetaAfterBuild(resource, buildType);
    return new Date().toISOString();
  } else {
    return resource?.lastBuildTimeStamp;
  }
};
