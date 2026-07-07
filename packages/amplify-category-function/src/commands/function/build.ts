import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';
import { ServiceName } from '../..';
import { categoryName } from '../../constants';
import { PackageRequestMeta } from '../../provider-utils/awscloudformation/types/packaging-types';
import { buildFunction } from '../../provider-utils/awscloudformation/utils/buildFunction';
import { packageResource } from '../../provider-utils/awscloudformation/utils/package';
export const name = 'build';

/**
 * To maintain existing behavior, this function builds and then packages lambda functions
 */
export const run = async (context: $TSContext) => {
  const resourceName = context?.input?.subCommands?.[0];
  const confirmContinue =
    !!resourceName ||
    context.input?.options?.yes ||
    (await prompter.yesOrNo('Are you sure you want to continue building the resources?', false));
  if (!confirmContinue) {
    return;
  }
  try {
    const resourcesToBuild = (await getSelectedResources(context, resourceName))
      .filter((resource) => resource.build)
      .filter((resource) => resource.service === ServiceName.LambdaFunction);
    for await (const resource of resourcesToBuild) {
      resource.lastBuildTimeStamp = await buildFunction(context, resource);
      await packageResource(context, resource);
    }
  } catch (err) {
    throw new AmplifyError(
      'PackagingLambdaFunctionError',
      { message: `There was an error building the function resources ${err.message}` },
      err,
    );
  }
};

const getSelectedResources = async (context: $TSContext, resourceName?: string) => {
  return (await context.amplify.getResourceStatus(categoryName, resourceName)).allResources as PackageRequestMeta[];
};
