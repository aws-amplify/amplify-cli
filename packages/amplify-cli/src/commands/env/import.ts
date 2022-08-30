import {
  $TSContext, JSONUtilities, stateManager, UnknownArgumentError,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { getConfiguredAmplifyClient } from 'amplify-provider-awscloudformation/src/aws-utils/aws-amplify';
import { findAppByBackendPredicate } from 'amplify-provider-awscloudformation/src/utils/amplify-client-lookups';

const errorLink = 'See https://docs.amplify.aws/cli/teams/commands/#import-an-environment';

/**
 * Entry point for env import
 */
export const run = async (context: $TSContext): Promise<void> => {
  const envName = context.parameters.options.name;
  if (!envName) {
    throw new Error('The environment name must be specified in --name');
  }

  if (!context.parameters.options.awsInfo) {
    throw new Error(`AWS credential info must be specified in --awsInfo. ${errorLink}`);
  }

  let awsInfo: Record<string, unknown>;
  try {
    awsInfo = JSONUtilities.parse(context.parameters.options.awsInfo);
  } catch (e) {
    throw new UnknownArgumentError(`Could not parse --awsInfo argument. ${errorLink}`);
  }

  let appIdParam: string | undefined = context.parameters.options.appId;
  if (appIdParam) {
    addNewLocalAwsInfo(envName, awsInfo, appIdParam);
    printer.success(`Successfully added environment from your project`);
    return;
  }

  // if we get here, we need to resolve the appId from the old parameters.
  // The only parameters we care about now are AmplifyAppId and if that`s not present, then StackName

  let config;
  try {
    config = JSONUtilities.parse(context.parameters.options.config);
  } catch (e) {
    throw new UnknownArgumentError(`Could not parse --config argument. ${errorLink}`);
  }

  appIdParam = config?.awscloudformation?.AmplifyAppId;
  if (appIdParam) {
    addNewLocalAwsInfo(envName, awsInfo, appIdParam);
    printer.success(`Successfully added environment from your project`);
    return;
  }

  // if app id is not specified in the input, we try to figure it out based on StackName
  // strategy:
  // write the localAwsInfo without appId so that the credential loader will configure the client properly
  // initialize an amplify client for the new imported environment
  // use amplify-client-lookup.findAppByBackendPredicate to locate appId for given stack name
  addNewLocalAwsInfo(envName, awsInfo);
  const amplifyClient = await getConfiguredAmplifyClient(context);
  if (!amplifyClient) {
    throw new UnknownArgumentError(`Could not construct Amplify client from specified config. ${errorLink}`);
  }
  const stackName = config?.awscloudformation?.StackName;
  appIdParam = (await findAppByBackendPredicate(amplifyClient, backend => backend.stackName === stackName))?.appId;

  if (appIdParam) {
    addNewLocalAwsInfo(envName, awsInfo, appIdParam);
    printer.success(`Successfully added environment from your project`);
    return;
  }

  throw new UnknownArgumentError(`Could not determine Amplify App Id from the specified config. ${errorLink}`);
};

const addNewLocalAwsInfo = (envName: string, envAwsInfo: Record<string, unknown>, appId?: string): void => {
  const localAwsInfo = stateManager.getLocalAWSInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  localAwsInfo[envName] = { ...(appId ? { appId } : undefined), ...envAwsInfo };

  stateManager.setLocalAWSInfo(undefined, localAwsInfo);
};
