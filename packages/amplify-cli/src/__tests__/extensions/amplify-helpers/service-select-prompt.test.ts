import { stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

jest.mock('@aws-amplify/amplify-prompts');
const printerMock = printer as jest.Mocked<typeof printer>;

let context = {};

describe('serviceSelectPrompt', () => {
  const mockExit = jest.fn();
  const promptMock = jest.fn();

  jest.mock('@aws-amplify/amplify-cli-core', () => ({
    ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
    exitOnNextTick: mockExit,
  }));

  jest.mock('inquirer', () => ({
    ...(jest.requireActual('inquirer') as {}),
    prompt: promptMock,
  }));

  const { serviceSelectionPrompt } = require('../../../extensions/amplify-helpers/service-select-prompt');

  const mockProjectConfig = {
    projectName: 'mockProjectName',
    version: '2.0',
    frontend: 'javascript',
    javascript: {
      framework: 'none',
      config: {
        SourceDir: 'src',
        DistributionDir: 'dist',
        BuildCommand: 'npm run-script build',
        StartCommand: 'npm run-script start',
      },
    },
    providers: ['awscloudformation'],
  };

  beforeEach(() => {
    context = {
      runtime: {
        plugins: [
          {
            name: 'category-category-category',
            directory: './',
          },
        ],
      },
      print: {
        success: jest.fn(),
      },
      usageData: {
        emitError: jest.fn(),
      },
      amplify: {
        readJsonFile: jest.fn().mockReturnValue({ Lambda: {} }),
        getCategoryPluginInfo: jest.fn().mockReturnValue({ packageLocation: './' }),
        updateamplifyMetaAfterResourceAdd: jest.fn(),
        pathManager: {
          getBackendDirPath: jest.fn(),
        },
        forceRemoveResource: jest.fn(),
        getTriggerMetadata: jest.fn(),
        cleanFunctions: jest.fn(),
        copyBatch: jest.fn(),
        deleteTrigger: jest.fn(),
        confirmPrompt: {
          run: jest.fn(),
        },
      },
    };

    jest.spyOn(stateManager, 'getProjectConfig').mockReturnValue(mockProjectConfig);
  });

  const mockAmplifyMeta = {
    providers: {
      awscloudformation: {
        AuthRoleName: 'checkhosting-20190226163640-authRole',
        UnauthRoleArn: 'arn:aws:iam::mockAccountId:role/checkhosting-20190226163640-unauthRole',
        AuthRoleArn: 'arn:aws:iam::mockAccountId:role/checkhosting-20190226163640-authRole',
        Region: 'us-west-2',
        DeploymentBucketName: 'checkhosting-20190226163640-deployment',
        UnauthRoleName: 'checkhosting-20190226163640-unauthRole',
        StackName: 'checkhosting-20190226163640',
        StackId: 'arn:aws:cloudformation:us-west-2:mockAccountId:stack/checkhosting-20190226163640/2c061610-3a28-11e9-acf3-02ee71065ed8',
      },
    },
    api: {
      mockProjectName: {
        service: 'AppSync',
        providerPlugin: 'awscloudformation',
        output: {
          authConfig: {
            defaultAuthentication: {
              authenticationType: 'API_KEY',
              apiKeyConfig: {
                apiKeyExpirationDays: 30,
                description: 'This is an api key',
              },
            },
            additionalAuthenticationProviders: [
              {
                authenticationType: 'AWS_IAM',
              },
            ],
          },
        },
      },
    },
  };

  it('should gracefully handle null supportedServices', async () => {
    const promptResponse = {
      name: undefined,
      service: undefined,
    };

    promptMock.mockImplementation(() => Promise.resolve(promptResponse));
    await expect(serviceSelectionPrompt(context, '', undefined)).rejects.toThrowError(
      'No services defined by configured providers for category',
    );
  });

  it('should gracefully handle null providers', async () => {
    (mockAmplifyMeta.providers as any) = undefined;

    const promptResponse = {
      name: undefined,
      service: undefined,
    };

    promptMock.mockImplementation(() => Promise.resolve(promptResponse));
    await expect(serviceSelectionPrompt(context, '', undefined)).rejects.toThrowError(
      'No services defined by configured providers for category',
    );
  });

  it('should return a service immediately if only one exists', async () => {
    const supportedServices = {
      awscloudformation: {
        alias: 'awscloudformation',
        provider: 'awscloudformation',
      },
    };

    const selectedProvider = await serviceSelectionPrompt(context, '', supportedServices);

    const expectedResult = {
      provider: undefined,
      providerName: 'awscloudformation',
      service: 'awscloudformation',
    };
    expect(selectedProvider).toEqual(expectedResult);
    expect(printerMock.info).toHaveBeenCalledWith('Using service: awscloudformation, provided by: awscloudformation');
  });

  it('should prompt if more than one provider is available', async () => {
    const supportedServices = {
      awscloudformation: {
        alias: 'awscloudformation',
        provider: 'awscloudformation',
      },
      testService: {
        alias: 'testService',
        provider: 'testService',
      },
    };

    mockProjectConfig.providers.push('testService');

    const expectedResult = {
      provider: undefined,
      providerName: 'awscloudformation',
      service: 'awscloudformation',
    };

    const promptResponse = {
      name: 'awscloudformation',
      service: expectedResult,
    };

    promptMock.mockImplementation(() => Promise.resolve(promptResponse));

    const selectedProvider = await serviceSelectionPrompt(context, 'Test', supportedServices);

    expect(selectedProvider).toEqual(expectedResult);
  });
});
