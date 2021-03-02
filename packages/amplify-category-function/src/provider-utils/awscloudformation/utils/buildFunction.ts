import { $TSContext, pathManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager, BuildRequest, BuildType } from 'amplify-function-plugin-interface';
import * as path from 'path';
import { category } from '../../../constants';

export const buildFunction = async (
  context: $TSContext,
  { resourceName, lastBuildTimeStamp, buildType = BuildType.PROD }: BuildRequestMeta,
) => {
  const resourcePath = path.join(pathManager.getBackendDirPath(), category, resourceName);
  const breadcrumbs = context.amplify.readBreadcrumbs(category, resourceName);

  const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
    context,
    breadcrumbs.pluginId,
  )) as FunctionRuntimeLifecycleManager;

  const depCheck = await runtimePlugin.checkDependencies(breadcrumbs.functionRuntime);
  if (!depCheck.hasRequiredDependencies) {
    context.print.error(depCheck.errorMessage || `You are missing dependencies required to package ${resourceName}`);
    throw new Error(`Missing required dependencies to package ${resourceName}`);
  }

  const prevBuildTime = lastBuildTimeStamp ? new Date(lastBuildTimeStamp) : undefined;

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
        resourceName: resourceName,
      },
      lastBuildTimeStamp: prevBuildTime,
    };
    rebuilt = (await runtimePlugin.build(buildRequest)).rebuilt;
  }
  if (rebuilt) {
    context.amplify.updateamplifyMetaAfterBuild({ category, resourceName }, buildType.toString());
    return new Date().toISOString();
  } else {
    return lastBuildTimeStamp;
  }
};

export interface BuildRequestMeta {
  resourceName: string;
  lastBuildTimeStamp?: string;
  buildType?: BuildType;
}

export const buildTypeKeyMap: Record<BuildType, string> = {
  [BuildType.PROD]: 'lastBuildTimeStamp',
  [BuildType.DEV]: 'lastDevBuildTimeStamp',
};
