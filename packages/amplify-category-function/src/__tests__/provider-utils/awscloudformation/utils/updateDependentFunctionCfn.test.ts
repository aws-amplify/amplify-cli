import { updateDependentFunctionsCfn } from '../../../../provider-utils/awscloudformation/utils/updateDependentFunctionCfn';
import { loadFunctionParameters } from '../../../../provider-utils/awscloudformation/utils/loadFunctionParameters';
import {
  getResourcesforCfn,
  generateEnvVariablesforCfn,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
import { $TSContext } from 'amplify-cli-core';
import { FunctionDependency } from 'amplify-function-plugin-interface/src';
jest.mock('fs-extra');

jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough');
jest.mock('../../../../provider-utils/awscloudformation/utils/loadFunctionParameters');
jest.mock('path');
jest.mock('../../../../provider-utils/awscloudformation/service-walkthroughs/lambda-walkthrough');
jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
}));
const contextStub = {
  amplify: {
    updateamplifyMetaAfterResourceUpdate: jest.fn(),
    copyBatch: jest.fn(),
  },
};

const allResources = [
  {
    service: 'AppSync',
    providerPlugin: 'awscloudformation',
  },
  {
    build: true,
    providerPlugin: 'awscloudformation',
    service: 'Lambda',
    dependsOn: [],
    resourceName: 'fn1',
  },
  {
    build: true,
    providerPlugin: 'awscloudformation',
    service: 'Lambda',
    resourceName: 'fn2',
    dependsOn: [
      {
        category: 'api',
        resourceName: 'mock_api',
        attributes: ['GraphQLAPIIdOutput'],
      },
    ],
  },
  {
    build: true,
    providerPlugin: 'awscloudformation',
    service: 'Lambda',
    resourceName: 'fn3',
    dependsOn: [
      {
        category: 'api',
        resourceName: 'mock_api',
        attributes: ['GraphQLAPIIdOutput'],
      },
    ],
  },
];
const backendDir = 'randomPath';
const apiResourceName = 'mock_api';

const loadResourceParameters_mock = loadFunctionParameters as jest.MockedFunction<typeof loadFunctionParameters>;
const getResourcesforCFN_mock = getResourcesforCfn as jest.MockedFunction<typeof getResourcesforCfn>;
const generateEnvVariablesforCFN_mock = generateEnvVariablesforCfn as jest.MockedFunction<typeof generateEnvVariablesforCfn>;

const cfnResources = [{ resourceName: 'storageattr1@model(appsync)' }, { resourceName: 'storageattr2@model(appsync)' }];
const permissionPolicies = 'randomPermissionsforapiandstorage';
const dependsOn: FunctionDependency[] = [
  {
    category: 'api',
    resourceName: 'mock_api',
    attributes: ['GraphQLAPIIdOutput'],
  },
];
const environmentMap = {
  API_MOCK_API_GRAPHQLAPIIDOUTPUT: {
    Ref: 'apimock_apiGraphQLAPIIdOutput',
  },
};
const envVarStringList = '';

getResourcesforCFN_mock.mockReturnValue(Promise.resolve({ permissionPolicies, cfnResources }));
generateEnvVariablesforCFN_mock.mockReturnValue(Promise.resolve({ dependsOn, environmentMap, envVarStringList }));

test('update dependent functions', async () => {
  const modelsDeleted = ['model3'];
  const FunctionMetaExpected = ['fn2', 'fn3'];
  loadResourceParameters_mock
    .mockReturnValueOnce({
      permissions: {
        storage: {
          model1: ['create'],
          model2: ['create'],
          model3: ['create'],
        },
      },
    })
    .mockReturnValueOnce({
      permissions: {
        storage: {
          model3: ['create'],
        },
      },
    });
  const fnMetaToBeUpdated = await updateDependentFunctionsCfn(
    (contextStub as unknown) as $TSContext,
    allResources,
    backendDir,
    modelsDeleted,
    apiResourceName,
  );
  expect(fnMetaToBeUpdated.map(resource => resource.resourceName).toString()).toBe(FunctionMetaExpected.toString());
});

test('update dependent functions', async () => {
  const modelsDeleted = ['model1', 'model2'];
  const FunctionMetaExpected = ['fn2'];
  loadResourceParameters_mock
    .mockReturnValueOnce({
      permissions: {
        storage: {
          model1: ['create'],
          model2: ['create'],
          model3: ['create'],
        },
      },
    })
    .mockReturnValueOnce({
      permissions: {
        storage: {
          model3: ['create'],
        },
      },
    });
  const fnMetaToBeUpdated = await updateDependentFunctionsCfn(
    (contextStub as unknown) as $TSContext,
    allResources,
    backendDir,
    modelsDeleted,
    apiResourceName,
  );
  expect(fnMetaToBeUpdated.map(resource => resource.resourceName).toString()).toBe(FunctionMetaExpected.toString());
});
