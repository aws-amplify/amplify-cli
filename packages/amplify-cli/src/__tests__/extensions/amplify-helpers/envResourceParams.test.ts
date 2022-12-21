import * as fs from 'fs-extra';
import {
  pathManager, stateManager, DeploymentSecrets, removeFromDeploymentSecrets, $TSContext,
} from 'amplify-cli-core';
import { getEnvInfo } from '../../../extensions/amplify-helpers/get-env-info';
import {
  saveEnvResourceParameters,
  loadEnvResourceParameters,
  removeResourceParameters,
  removeDeploymentSecrets,
} from '../../../extensions/amplify-helpers/envResourceParams';

jest.mock('fs-extra');
jest.mock('amplify-cli-core', () => ({
  pathManager: { getTeamProviderInfoFilePath: jest.fn() },
  stateManager: {
    getTeamProviderInfo: jest.fn(),
    setTeamProviderInfo: jest.fn(),
    getDeploymentSecrets: jest.fn(),
    setDeploymentSecrets: jest.fn(),
    getLocalEnvInfo: jest.fn().mockReturnValue({ envName: 'testEnv' }),
    getBackendConfig: jest.fn(),
    getMeta: jest.fn().mockReturnValue({
      providers: {
        awscloudformation: {
          StackId: 'arn:aws:cloudformation:us-west-2:1234567890:stack/amplify-test-test-123456/testStackId',
        },
      },
    }),
  },
  removeFromDeploymentSecrets: jest.fn(),
}));
jest.mock('../../../extensions/amplify-helpers/get-env-info', () => ({ getEnvInfo: jest.fn() }));

let getEnvParamManager;
let ensureEnvParamManager;

beforeEach(async () => {
  ({ ensureEnvParamManager, getEnvParamManager } = await import('@aws-amplify/amplify-environment-parameters'));
  await ensureEnvParamManager('testEnv');
  jest.clearAllMocks();
  (fs.existsSync as any).mockReturnValue(true);
  (getEnvInfo as any).mockReturnValue({ envName: 'testEnv' });
  (pathManager.getTeamProviderInfoFilePath as any).mockReturnValue('test/path');
});

test('saveEnvResourceParams appends to existing params', () => {
  getEnvParamManager('testEnv')
    .getResourceParamManager('testCategory', 'testResourceName')
    .setParam('existingParam', 'existingParamValue');

  saveEnvResourceParameters(undefined, 'testCategory', 'testResourceName', { newParam: 'newParamValue' });
  expect(
    getEnvParamManager('testEnv')
      .getResourceParamManager('testCategory', 'testResourceName')
      .getAllParams(),
  ).toEqual({
    existingParam: 'existingParamValue',
    newParam: 'newParamValue',
  });
});

test('loadEnvResourceParameters load params from environment param manager', () => {
  getEnvParamManager('testEnv')
    .getResourceParamManager('testCategory2', 'testResourceName')
    .setParam('existingParam', 'existingParamValue');
  const params = loadEnvResourceParameters(undefined, 'testCategory2', 'testResourceName');
  expect(params).toEqual({
    existingParam: 'existingParamValue',
  });
});

test('loadEnvResourceParameters load params from deployment secrets and env param manager', () => {
  getEnvParamManager('testEnv')
    .getResourceParamManager('testCategory3', 'testResourceName')
    .setParam('existingParam', 'existingParamValue');
  const existingSecretsParams: DeploymentSecrets = {
    appSecrets: [
      {
        rootStackId: 'testStackId',
        environments: {
          testEnv: {
            testCategory3: {
              testResourceName: {
                existingSecretsParam: 'existingSecretsParamValue',
              },
            },
          },
        },
      },
    ],
  };
  const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
  stateManagerMock.getDeploymentSecrets.mockReturnValue(existingSecretsParams);

  const params = loadEnvResourceParameters(undefined, 'testCategory3', 'testResourceName');
  expect(params).toEqual({
    existingParam: 'existingParamValue',
    existingSecretsParam: 'existingSecretsParamValue',
  });
});

test('removeResourceParameters remove resource params from team provider info', () => {
  getEnvParamManager('testEnv')
    .getResourceParamManager('testCategory', 'testResourceName')
    .setParam('existingParam', 'existingParamValue');
  removeResourceParameters(({} as unknown) as $TSContext, 'testCategory', 'testResourceName');
  expect(getEnvParamManager('testEnv').hasResourceParamManager('testCategory', 'testResourceName')).toBe(false);
});

test('removeDeploymentSecrets remove secrets params', () => {
  const existingSecretsParams: DeploymentSecrets = {
    appSecrets: [
      {
        rootStackId: 'testStackId',
        environments: {
          testEnv: {
            testCategory: {
              testResourceName: {
                existingSecretsParam: 'existingSecretsParamValue',
              },
            },
          },
        },
      },
    ],
  };
  const removedSecretsParams: DeploymentSecrets = {
    appSecrets: [],
  };

  const deploymentSecretsRemove = {
    currentDeploymentSecrets: existingSecretsParams,
    rootStackId: 'testStackId',
    envName: 'testEnv',
    category: 'testCategory',
    resource: 'testResourceName',
    keyName: 'hostedUIProviderCreds',
  };

  const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
  stateManagerMock.getDeploymentSecrets.mockReturnValue(existingSecretsParams);
  const removeFromDeploymentSecretsMock = removeFromDeploymentSecrets as jest.MockedFunction<typeof removeFromDeploymentSecrets>;
  removeFromDeploymentSecretsMock.mockReturnValue(removedSecretsParams);

  removeDeploymentSecrets(undefined, 'testCategory', 'testResourceName');

  expect(removeFromDeploymentSecrets).toHaveBeenCalledWith(deploymentSecretsRemove);
  expect(stateManagerMock.setDeploymentSecrets).toHaveBeenCalledWith(removedSecretsParams);
});
