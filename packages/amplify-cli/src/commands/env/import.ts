import {
  $TSContext, EnvAwsInfo, JSONUtilities, stateManager, UnknownArgumentError, AmplifyError,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { getConfiguredAmplifyClient, findAppByBackendPredicate } from 'amplify-provider-awscloudformation';
import { Amplify } from 'aws-sdk';

const errorLink = 'See https://docs.amplify.aws/cli/teams/commands/#import-an-environment';

/**
 * Entry point for env import
 */
export const run = async (context: $TSContext): Promise<void> => {
  const envName = context.parameters.options.name;
  if (!envName) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name was not specified.',
      resolution: 'Pass in the name of the environment using the --name flag.',
    });
  }

  if (!context.parameters.options.awsInfo) {
    throw new Error(`AWS credential info must be specified in --awsInfo. ${errorLink}`);
  }

  let awsInfo: Partial<EnvAwsInfo>;
  try {
    awsInfo = JSONUtilities.parse(context.parameters.options.awsInfo);
  } catch (e) {
    throw new UnknownArgumentError(`Could not parse --awsInfo argument. ${errorLink}`);
  }

  let appIdParam: string | undefined = context.parameters.options.appId;
  if (appIdParam) {
    addNewLocalAwsInfoUnsafeDoNotExport(envName, awsInfo, appIdParam);
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
  const regionParam: string | undefined = config?.awscloudformation?.Region;
  if (appIdParam && regionParam) {
    addNewLocalAwsInfoUnsafeDoNotExport(envName, awsInfo, appIdParam, regionParam);
    printer.success(`Successfully added environment from your project`);
    return;
  }

  // if app id is not specified in the input, we try to figure it out based on StackName
  // strategy:
  // write the localAwsInfo without appId so that the credential loader will configure the client properly
  // initialize an amplify client for the new imported environment
  // use amplify-client-lookup.findAppByBackendPredicate to locate appId for given stack name
  addNewLocalAwsInfoUnsafeDoNotExport(envName, awsInfo);
  const amplifyClient = await getConfiguredAmplifyClient(context) as Amplify;
  if (!amplifyClient) {
    throw new UnknownArgumentError(`Could not construct Amplify client from specified config. ${errorLink}`);
  }
  const stackName = config?.awscloudformation?.StackName;
  appIdParam = (await findAppByBackendPredicate(amplifyClient, backend => backend.stackName === stackName))?.appId;

  if (appIdParam) {
    addNewLocalAwsInfoUnsafeDoNotExport(envName, awsInfo, appIdParam, amplifyClient.config.region);
    printer.success(`Successfully added environment from your project`);
    return;
  }

  throw new UnknownArgumentError(`Could not determine Amplify App Id from the specified config. ${errorLink}`);
};

/**
 * Writes a potentially incomplete entry into local-aws-info
 *
 * This is used internally to this module to load an Amplify client before an environment is fully initialized to try to fetch the appId
 * for the environment at which point the local-aws-info entry is updated to include the appId
 *
 * This function should not be used outside of this module
 *
 * @param envName The env name to update
 * @param envAwsInfo A partial aws info entry
 * @param appId The app Id for the env
 */
const addNewLocalAwsInfoUnsafeDoNotExport = (envName: string, envAwsInfo: Partial<EnvAwsInfo>, appId?: string, region?: string): void => {
  const localAwsInfo = stateManager.getLocalAWSInfo(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  // unsafe!
  localAwsInfo[envName] = {
    ...(appId ? { AmplifyAppId: appId } : undefined),
    ...(region ? { Region: region } : undefined),
    ...envAwsInfo,
  } as unknown as EnvAwsInfo;

  stateManager.setLocalAWSInfo(undefined, localAwsInfo);
};
