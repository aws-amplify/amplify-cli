import { $TSContext, pathManager } from 'amplify-cli-core';
import { FunctionRuntimeLifecycleManager, BuildRequest, BuildType } from 'amplify-function-plugin-interface';
import * as path from 'path';
import { categoryName } from '../../../constants';

export const buildFunction = async (
  context: $TSContext,
  { resourceName, lastBuildTimestamp, buildType = BuildType.PROD }: BuildRequestMeta,
) => {
  const resourcePath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  const breadcrumbs = context.amplify.readBreadcrumbs(categoryName, resourceName);

  const runtimePlugin: FunctionRuntimeLifecycleManager = (await context.amplify.loadRuntimePlugin(
    context,
    breadcrumbs.pluginId,
  )) as FunctionRuntimeLifecycleManager;

  const depCheck = await runtimePlugin.checkDependencies(breadcrumbs.functionRuntime);
  if (!depCheck.hasRequiredDependencies) {
    context.print.error(depCheck.errorMessage || `You are missing dependencies required to package ${resourceName}`);
    throw new Error(`Missing required dependencies to package ${resourceName}`);
  }

  const prevBuildTime = lastBuildTimestamp ? new Date(lastBuildTimestamp) : undefined;

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
    context.amplify.updateamplifyMetaAfterBuild({ category: categoryName, resourceName }, buildType.toString());
    return new Date().toISOString();
  } else {
    return lastBuildTimestamp;
  }
};

export interface BuildRequestMeta {
  resourceName: string;
  lastBuildTimestamp?: string;
  buildType?: BuildType;
}

export const buildTypeKeyMap: Record<BuildType, string> = {
  [BuildType.PROD]: 'lastBuildTimeStamp',
  [BuildType.DEV]: 'lastDevBuildTimeStamp',
};
