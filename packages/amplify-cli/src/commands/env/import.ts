import {
  $TSContext, JSONUtilities, stateManager, AmplifyError,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

/**
 * Entry point for import command
 */
export const run = async (context: $TSContext): Promise<void> => {
  const envName = context.parameters.options.name;
  if (!envName) {
    throw new AmplifyError('EnvironmentNameError', {
      message: 'Environment name was not specified.',
      resolution: 'Pass in the name of the environment using the --name flag.',
    });
  }

  let config;

  try {
    config = JSONUtilities.parse(context.parameters.options.config);

    const awsCF = config.awscloudformation;

    if (
      !(
        // eslint-disable-next-line spellcheck/spell-checker
        /* eslint-disable no-prototype-builtins */
        config.hasOwnProperty('awscloudformation')
        && awsCF.hasOwnProperty('Region')
        && awsCF.Region
        && awsCF.hasOwnProperty('DeploymentBucketName')
        && awsCF.DeploymentBucketName
        && awsCF.hasOwnProperty('UnauthRoleName')
        && awsCF.UnauthRoleName
        && awsCF.hasOwnProperty('StackName')
        && awsCF.StackName
        && awsCF.hasOwnProperty('StackId')
        && awsCF.StackId
        && awsCF.hasOwnProperty('AuthRoleName')
        && awsCF.AuthRoleName
        && awsCF.hasOwnProperty('UnauthRoleArn')
        && awsCF.UnauthRoleArn
        && awsCF.hasOwnProperty('AuthRoleArn')
        && awsCF.AuthRoleArn
      // eslint-disable-next-line spellcheck/spell-checker
      /* eslint-enable no-prototype-builtins */
      )
    ) {
      throw new AmplifyError('EnvironmentConfigurationError', {
        message: 'The environment configuration provided is missing required properties.',
        resolution: 'Add the required properties and try again.',
        link: 'https://docs.amplify.aws/cli/teams/commands/#import-an-environment',
      });
    }
  } catch (e) {
    throw new AmplifyError('EnvironmentConfigurationError', {
      message: 'Environment configuration was not specified or was formatted incorrectly.',
      resolution: 'You must pass in the configuration of the environment in an object format using the --config flag.',
    });
  }

  let awsInfo;

  if (context.parameters.options.awsInfo) {
    try {
      awsInfo = JSONUtilities.parse(context.parameters.options.awsInfo);
    } catch (e) {
      throw new AmplifyError('EnvironmentConfigurationError', {
        message: 'The AWS credential info was not specified or was incorrectly formatted.',
        resolution: 'Pass in the AWS credential info in an object format using the --awsInfo flag.',
        link: 'https://docs.amplify.aws/cli/teams/commands/#import-an-environment',
      });
    }
  }

  const allEnvs = context.amplify.getEnvDetails();

  const addNewEnvConfig = (): void => {
    allEnvs[envName] = config;
    stateManager.setTeamProviderInfo(undefined, allEnvs);

    const envAwsInfo = stateManager.getLocalAWSInfo(undefined, {
      throwIfNotExist: false,
      default: {},
    });

    envAwsInfo[envName] = awsInfo;

    stateManager.setLocalAWSInfo(undefined, envAwsInfo);

    printer.success('Successfully added environment from your project');
  };

  // eslint-disable-next-line spellcheck/spell-checker
  // eslint-disable-next-line no-prototype-builtins
  if (allEnvs.hasOwnProperty(envName)) {
    if (context.parameters.options.yes) {
      addNewEnvConfig();
    } else if (
      await context.amplify.confirmPrompt(
        'We found an environment with the same name. Do you want to overwrite the existing environment config?',
      )
    ) {
      addNewEnvConfig();
    }
  } else {
    addNewEnvConfig();
  }
};
