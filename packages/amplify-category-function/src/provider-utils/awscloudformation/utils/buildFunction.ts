import { $TSContext, pathManager, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { BuildRequest, BuildType, FunctionRuntimeLifecycleManager } from '@aws-amplify/amplify-function-plugin-interface';
import { printer } from '@aws-amplify/amplify-prompts';
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
    printer.error(depCheck.errorMessage || `You are missing dependencies required to package ${resourceName}`);
    throw new AmplifyError('PackagingLambdaFunctionError', { message: `Missing required dependencies to package ${resourceName}` });
  }

  const prevBuildTime = lastBuildTimestamp ? new Date(lastBuildTimestamp) : undefined;

  // build the function
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
    scripts: breadcrumbs.scripts,
  };
  const rebuilt = (await runtimePlugin.build(buildRequest)).rebuilt;
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
