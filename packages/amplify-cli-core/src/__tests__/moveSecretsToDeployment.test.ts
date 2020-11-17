import { StateManager } from '../state-manager';

const teamProviderInfoSecrets = {
  dev: {
    awscloudformation: {
      AuthRoleName: 'amplify-teamprovider-dev-134909-authRole',
      UnauthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-dev-134909-unauthRole',
      AuthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-dev-134909-authRole',
      Region: 'us-east-1',
      DeploymentBucketName: 'amplify-teamprovider-dev-134909-deployment',
      UnauthRoleName: 'amplify-teamprovider-dev-134909-unauthRole',
      StackName: 'amplify-teamprovider-dev-134909',
      StackId: 'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-dev-134909/df33f4d0-1895-11eb-a8b4-0e706f74ed45',
      AmplifyAppId: 'd3h26vjc54v5ze',
    },
    categories: {
      auth: {
        tagseb306692: {
          hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"asd","client_secret":"asd"}]',
        },
      },
    },
  },
  prod: {
    awscloudformation: {
      AuthRoleName: 'amplify-teamprovider-prod-164239-authRole',
      UnauthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-prod-164239-unauthRole',
      AuthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-prod-164239-authRole',
      Region: 'us-east-1',
      DeploymentBucketName: 'amplify-teamprovider-prod-164239-deployment',
      UnauthRoleName: 'amplify-teamprovider-prod-164239-unauthRole',
      StackName: 'amplify-teamprovider-prod-164239',
      StackId: 'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-prod-164239/1b625f60-18ae-11eb-9e65-0ab042f700a7',
      AmplifyAppId: 'd3h26vjc54v5ze',
    },
    categories: {
      auth: {
        teamprovider1819bdce: {
          hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"abc","client_secret":"adb"}]',
        },
      },
    },
  },
};

const teamProviderInfoWithoutSecrets = {
  dev: {
    awscloudformation: {
      AuthRoleName: 'amplify-teamprovider-dev-134909-authRole',
      UnauthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-dev-134909-unauthRole',
      AuthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-dev-134909-authRole',
      Region: 'us-east-1',
      DeploymentBucketName: 'amplify-teamprovider-dev-134909-deployment',
      UnauthRoleName: 'amplify-teamprovider-dev-134909-unauthRole',
      StackName: 'amplify-teamprovider-dev-134909',
      StackId: 'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-dev-134909/df33f4d0-1895-11eb-a8b4-0e706f74ed45',
      AmplifyAppId: 'd3h26vjc54v5ze',
    },
    categories: {
      auth: {
        tagseb306692: {},
      },
    },
  },
  prod: {
    awscloudformation: {
      AuthRoleName: 'amplify-teamprovider-prod-164239-authRole',
      UnauthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-prod-164239-unauthRole',
      AuthRoleArn: 'arn:aws:iam::1234567891011:role/amplify-teamprovider-prod-164239-authRole',
      Region: 'us-east-1',
      DeploymentBucketName: 'amplify-teamprovider-prod-164239-deployment',
      UnauthRoleName: 'amplify-teamprovider-prod-164239-unauthRole',
      StackName: 'amplify-teamprovider-prod-164239',
      StackId: 'arn:aws:cloudformation:us-east-1:1234567891011:stack/amplify-teamprovider-prod-164239/1b625f60-18ae-11eb-9e65-0ab042f700a7',
      AmplifyAppId: 'd3h26vjc54v5ze',
    },
    categories: {
      auth: {
        teamprovider1819bdce: {
          hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"abc","client_secret":"adb"}]',
        },
      },
    },
  },
};
const secrets = {
  appSecrets: [
    {
      amplifyAppId: 'd3h26vjc54v5ze',
      environments: {
        dev: {
          auth: {
            tagseb306692: {
              hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"asd","client_secret":"asd"}]',
            },
          },
        },
      },
    },
  ],
};

describe('test move secrests to deployment', () => {
  const stateManager = new StateManager();
  const mockGetLocalEnvInfo = jest.spyOn(stateManager, 'getLocalEnvInfo').mockReturnValue({ envName: 'dev' });
  const mockGetTeamProviderInfo = jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue(teamProviderInfoSecrets);
  const setTeamProviderInfo = jest.spyOn(stateManager, 'setTeamProviderInfo').mockImplementation();
  const setDeploymentSecrets = jest.spyOn(stateManager, 'setDeploymentSecrets').mockImplementation();
  it('test with migrate', () => {
    stateManager.moveSecretsFromTeamProviderToDeployment();
    expect(setTeamProviderInfo).toBeCalledWith(undefined, teamProviderInfoWithoutSecrets);
    expect(setDeploymentSecrets).toBeCalledWith(secrets);
    expect(mockGetTeamProviderInfo).toBeCalled();
    expect(mockGetLocalEnvInfo).toBeCalled();
  });
});
