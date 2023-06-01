import { pathManager, stateManager, readCFNTemplate, writeCFNTemplate, CFNTemplateFormat } from '@aws-amplify/amplify-cli-core';
import { ensureLambdaExecutionRoleOutputs } from '../../../../provider-utils/awscloudformation/utils/ensure-lambda-arn-outputs';

jest.mock('@aws-amplify/amplify-cli-core');
const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
const readCFNTemplateMock = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;
const writeCFNTemplateMock = writeCFNTemplate as jest.MockedFunction<typeof writeCFNTemplate>;

describe('test ensureLambdaExecutionRoleOutputs function', () => {
  beforeEach(() => {
    pathManagerMock.getBackendDirPath = jest.fn().mockReturnValue('backend');
    stateManagerMock.getBackendConfig = jest.fn();
  });

  afterEach(() => jest.resetAllMocks());

  it(' when no functions are present', async () => {
    stateManagerMock.getBackendConfig.mockReturnValue({
      auth: {
        authtriggertestb3a9da62b3a9da62: {
          customAuth: false,
          providerPlugin: 'awscloudformation',
          service: 'Cognito',
        },
      },
    });
    readCFNTemplateMock.mockReturnValue(undefined);
    await ensureLambdaExecutionRoleOutputs();
    expect(writeCFNTemplateMock).not.toBeCalled();
  });

  it(' when functions have no role arns in outputs', async () => {
    stateManagerMock.getBackendConfig.mockReturnValue({
      auth: {
        authtriggertestb3a9da62b3a9da62: {
          customAuth: false,
          dependsOn: [
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PostAuthentication',
              triggerProvider: 'Cognito',
            },
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PostConfirmation',
              triggerProvider: 'Cognito',
            },
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PreAuthentication',
              triggerProvider: 'Cognito',
            },
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PreSignup',
              triggerProvider: 'Cognito',
            },
          ],
          providerPlugin: 'awscloudformation',
          service: 'Cognito',
        },
      },
      function: {
        authtriggertestb3a9da62b3a9da62PostAuthentication: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
        authtriggertestb3a9da62b3a9da62PostConfirmation: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
        authtriggertestb3a9da62b3a9da62PreAuthentication: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
        authtriggertestb3a9da62b3a9da62PreSignup: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
      },
    });
    readCFNTemplateMock.mockReturnValue({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: {
        Outputs: {
          Name: {
            Value: {
              Ref: 'LambdaFunction',
            },
          },
          Arn: {
            Value: {
              'Fn::GetAtt': ['LambdaFunction', 'Arn'],
            },
          },
          LambdaExecutionRole: {
            Value: {
              Ref: 'LambdaExecutionRole',
            },
          },
          Region: {
            Value: {
              Ref: 'AWS::Region',
            },
          },
        },
      },
    });
    await ensureLambdaExecutionRoleOutputs();
    expect(writeCFNTemplateMock.mock.calls[0][0]).toMatchInlineSnapshot(`
{
  "Outputs": {
    "Arn": {
      "Value": {
        "Fn::GetAtt": [
          "LambdaFunction",
          "Arn",
        ],
      },
    },
    "LambdaExecutionRole": {
      "Value": {
        "Ref": "LambdaExecutionRole",
      },
    },
    "LambdaExecutionRoleArn": {
      "Value": {
        "Fn::GetAtt": [
          "LambdaExecutionRole",
          "Arn",
        ],
      },
    },
    "Name": {
      "Value": {
        "Ref": "LambdaFunction",
      },
    },
    "Region": {
      "Value": {
        "Ref": "AWS::Region",
      },
    },
  },
}
`);
  });

  it(' when functions have role arns in outputs', async () => {
    stateManagerMock.getMeta.mockReturnValue({
      auth: {
        authtriggertestb3a9da62b3a9da62: {
          customAuth: false,
          dependsOn: [
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PostAuthentication',
              triggerProvider: 'Cognito',
            },
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PostConfirmation',
              triggerProvider: 'Cognito',
            },
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PreAuthentication',
              triggerProvider: 'Cognito',
            },
            {
              attributes: ['Arn', 'Name'],
              category: 'function',
              resourceName: 'authtriggertestb3a9da62b3a9da62PreSignup',
              triggerProvider: 'Cognito',
            },
          ],
          providerPlugin: 'awscloudformation',
          service: 'Cognito',
        },
      },
      function: {
        authtriggertestb3a9da62b3a9da62PostAuthentication: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
        authtriggertestb3a9da62b3a9da62PostConfirmation: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
        authtriggertestb3a9da62b3a9da62PreAuthentication: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
        authtriggertestb3a9da62b3a9da62PreSignup: {
          build: true,
          providerPlugin: 'awscloudformation',
          service: 'Lambda',
        },
      },
    });
    readCFNTemplateMock.mockReturnValue({
      templateFormat: CFNTemplateFormat.JSON,
      cfnTemplate: {
        Outputs: {
          Name: {
            Value: {
              Ref: 'LambdaFunction',
            },
          },
          Arn: {
            Value: {
              'Fn::GetAtt': ['LambdaFunction', 'Arn'],
            },
          },
          LambdaExecutionRole: {
            Value: {
              Ref: 'LambdaExecutionRole',
            },
          },
          LambdaExecutionRoleArn: {
            Value: {
              Ref: 'LambdaExecutionRoleArn',
            },
          },
          Region: {
            Value: {
              Ref: 'AWS::Region',
            },
          },
        },
      },
    });
    await ensureLambdaExecutionRoleOutputs();
    expect(writeCFNTemplateMock).not.toBeCalled();
  });
});
