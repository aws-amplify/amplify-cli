import { Context } from '../domain/context';

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
      AmplifyAppId: 'd1gmlw7l76gj9',
    },
    categories: {
      auth: {
        teamprovider1819bdce: {
          hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"asdasdasdasd","client_secret":"asdasdasd"}]',
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
      AmplifyAppId: 'd1gmlw7l76gj9',
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
      AmplifyAppId: 'd1gmlw7l76gj9',
    },
    categories: {
      auth: {
        teamprovider1819bdce: {},
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
      AmplifyAppId: 'd1gmlw7l76gj9',
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
  d1gmlw7l76gj9: {
    dev: {
      auth: {
        teamprovider1819bdce: {
          hostedUIProviderCreds: '[{"ProviderName":"Facebook","client_id":"asdasdasdasd","client_secret":"asdasdasd"}]',
        },
      },
    },
  },
};

describe('test migration code', () => {
  it('case: test for teamprovide with secrets', async () => {
    const promptConfirm = jest.fn().mockReturnValue(true);
    const mockMoveSecrets = jest.fn();
    const mockteamProviderInfoHasAuthSecrets = jest.fn().mockReturnValue(true);
    jest.setMock('amplify-cli-core', {
      stateManager: {
        moveSecretsFromTeamProviderToDeployment: mockMoveSecrets,
        teamProviderInfoHasAuthSecrets: mockteamProviderInfoHasAuthSecrets,
      },
      pathManager: {
        findProjectRoot: jest.fn().mockReturnValue(true),
      },
    });
    const mockContext: Context = jest.genMockFromModule('../domain/context');
    mockContext.exeInfo = {
      inputParams: {},
    };
    mockContext.prompt = {
      confirm: promptConfirm,
    };
    mockContext.input = {
      argv: [],
      command: 'status',
    };
    const migrated = await require('../utils/team-provider-migrate').MigrateTeamProvider(mockContext);
    expect(migrated).toEqual(true);
    expect(mockMoveSecrets).toBeCalled();
    expect(mockteamProviderInfoHasAuthSecrets).toBeCalled();
  });
});
