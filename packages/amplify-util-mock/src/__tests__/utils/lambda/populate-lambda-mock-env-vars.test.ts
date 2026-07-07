import { loadConfigurationForEnv } from '@aws-amplify/amplify-provider-awscloudformation';
import { ProcessedLambdaFunction } from '../../../CFNParser/stack/types';
import { populateLambdaMockEnvVars } from '../../../utils/lambda/populate-lambda-mock-env-vars';
import { stateManager, pathManager, $TSContext } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';
import * as dotenv from 'dotenv';

jest.mock('@aws-amplify/amplify-provider-awscloudformation');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('dotenv');

const loadConfigurationForEnv_mock = loadConfigurationForEnv as jest.MockedFunction<typeof loadConfigurationForEnv>;
loadConfigurationForEnv_mock.mockResolvedValue({
  credentials: {
    accessKeyId: 'testaccesskey',
    secretAccessKey: 'testsecretaccesskey',
    sessionToken: 'testsessiontoken',
  },
  region: 'test-region',
});

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getLocalEnvInfo.mockReturnValue({ envName: 'test' });

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
pathManager_mock.getBackendDirPath.mockReturnValue('backend/path');

const dotenv_mock = dotenv as jest.Mocked<typeof dotenv>;

describe('populate lambda mock env vars', () => {
  beforeEach(() => jest.clearAllMocks());
  it('populates AWS credential variables', async () => {
    const processedLambda: ProcessedLambdaFunction = {
      cfnExposedAttributes: {},
      name: 'testLambda',
      handler: 'test.handler',
      environment: {},
    };

    await populateLambdaMockEnvVars({} as $TSContext, processedLambda);
    expect(processedLambda.environment).toMatchObject({
      AWS_ACCESS_KEY_ID: 'testaccesskey',
      AWS_SECRET_ACCESS_KEY: 'testsecretaccesskey',
      AWS_SESSION_TOKEN: 'testsessiontoken',
    });
  });

  it('loads dynamic defaults', async () => {
    const processedLambda: ProcessedLambdaFunction = {
      cfnExposedAttributes: {},
      name: 'testLambda',
      handler: 'test.handler',
      environment: {},
    };
    stateManager_mock.getMeta.mockReturnValue({
      providers: {
        awscloudformation: {
          Region: 'test-region',
        },
      },
    });
    const expectedPath = path.join('backend/path', 'function', processedLambda.name);

    await populateLambdaMockEnvVars({} as $TSContext, processedLambda);
    expect(processedLambda.environment).toMatchObject({
      _HANDLER: processedLambda.handler,
      AWS_REGION: 'test-region',
      AWS_LAMBDA_FUNCTION_NAME: processedLambda.name,
      LAMBDA_TASK_ROOT: expectedPath,
      LAMBDA_RUNTIME_DIR: expectedPath,
    });
  });

  it('loads dot env values', async () => {
    const processedLambda: ProcessedLambdaFunction = {
      cfnExposedAttributes: {},
      name: 'testLambda',
      handler: 'test.handler',
      environment: {},
    };
    const expectedMap = {
      CUSTOM_MOCK_ENV_VAR: 'some value',
    };
    pathManager_mock.getBackendDirPath.mockReturnValueOnce('backend/path');
    dotenv_mock.config.mockReturnValueOnce({
      parsed: expectedMap,
    });

    await populateLambdaMockEnvVars({} as $TSContext, processedLambda);
    expect(processedLambda.environment).toMatchObject(expectedMap);
  });
});
