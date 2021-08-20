import { $TSContext, pathManager } from 'amplify-cli-core';
import { BuildRequest, BuildType, FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import { categoryName } from '../../../constants';

export const buildFunction = async (
  context: $TSContext,
  { resourceName, lastBuildTimestamp, lastBuildType, buildType = BuildType.PROD }: BuildRequestMeta,
) => {
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
      srcRoot: pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName),
      runtime: breadcrumbs.functionRuntime,
      legacyBuildHookParams: {
        projectRoot: pathManager.findProjectRoot(),
        resourceName,
      },
      lastBuildTimeStamp: prevBuildTime,
      lastBuildType,
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
  lastBuildType?: BuildType;
  buildType?: BuildType;
}

export const buildTypeKeyMap: Record<BuildType, string> = {
  [BuildType.PROD]: 'lastBuildTimeStamp',
  [BuildType.DEV]: 'lastDevBuildTimeStamp',
};
