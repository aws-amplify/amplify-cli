import { updateDependentFunctionsCfn } from '../../../../provider-utils/awscloudformation/utils/updateDependentFunctionCfn';
import { loadFunctionParameters } from '../../../../provider-utils/awscloudformation/utils/loadFunctionParameters';
import {
  getResourcesForCfn,
  generateEnvVariablesForCfn,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
import { $TSContext } from 'amplify-cli-core';
import { FunctionDependency } from 'amplify-function-plugin-interface/src';
import { updateCFNFileForResourcePermissions } from '../../../../provider-utils/awscloudformation/service-walkthroughs/lambda-walkthrough';
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
const getResourcesforCFN_mock = getResourcesForCfn as jest.MockedFunction<typeof getResourcesForCfn>;
const generateEnvVariablesforCFN_mock = generateEnvVariablesForCfn as jest.MockedFunction<typeof generateEnvVariablesForCfn>;

const updateCFNFileForResourcePermissions_mock = updateCFNFileForResourcePermissions as jest.MockedFunction<
  typeof updateCFNFileForResourcePermissions
>;
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
  jest.clearAllMocks();
  const modelsDeleted = ['model3'];
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
  await updateDependentFunctionsCfn((contextStub as unknown) as $TSContext, allResources, backendDir, modelsDeleted, apiResourceName);
  expect(updateCFNFileForResourcePermissions_mock.mock.calls[0][1]).toMatchSnapshot();
});

test('update dependent functions', async () => {
  jest.clearAllMocks();
  const modelsDeleted = ['model1', 'model2'];
  loadResourceParameters_mock
    .mockReturnValueOnce({
      permissions: {
        storage: {
          model1: ['create'],
          model2: ['create'],
          model3: ['create'],
        },
      },
      lambdaLayers: [
        {
          type: 'ProjectLayer',
          resourceName: 'mocklayer',
          version: 1,
        },
      ],
    })
    .mockReturnValueOnce({
      permissions: {
        storage: {
          model3: ['create'],
        },
      },
      lambdaLayers: [
        {
          type: 'ProjectLayer',
          resourceName: 'mocklayer',
          version: 1,
        },
      ],
    });
  await updateDependentFunctionsCfn((contextStub as unknown) as $TSContext, allResources, backendDir, modelsDeleted, apiResourceName);
  expect(updateCFNFileForResourcePermissions_mock.mock.calls[0][1]).toMatchSnapshot();
});
