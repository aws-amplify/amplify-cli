import {
  getResourcesForCfn,
  generateEnvVariablesForCfn,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
import {
  constructCFModelTableNameComponent,
  constructCFModelTableArnComponent,
} from '../../../../provider-utils/awscloudformation/utils/cloudformationHelpers';

jest.mock('../../../../provider-utils/awscloudformation/utils/cloudformationHelpers');

export const appsyncTableSuffix = '@model(appsync)';

const constructCFModelTableNameComponent_mock = constructCFModelTableNameComponent as jest.MockedFunction<
  typeof constructCFModelTableNameComponent
>;
const constructCFModelTableArnComponent_mock = constructCFModelTableArnComponent as jest.MockedFunction<
  typeof constructCFModelTableArnComponent
>;
const appsyncResourceName = 'mock_api';
const resourceName = 'storage';

constructCFModelTableNameComponent_mock.mockImplementation(() => {
  return {
    'Fn::ImportValue': {
      'Fn::Sub': `\${api${appsyncResourceName}GraphQLAPIIdOutput}:GetAtt:${resourceName.replace(`:${appsyncTableSuffix}`, 'Table')}:Name`,
    },
  };
});

constructCFModelTableArnComponent_mock.mockImplementation(() => {
  return [
    'arn:aws:dynamodb:',
    { Ref: 'aws_region' },
    ':',
    { Ref: 'aws_accountId' },
    ':table/',
    constructCFModelTableNameComponent(appsyncResourceName, resourceName, appsyncTableSuffix),
  ];
});

test('check CFN resources for storage', async () => {
  const resourceAttributes = [{ resourceName: 'storageattr1@model(appsync)' }, { resourceName: 'storageattr2@model(appsync)' }];
  const permissionPolicies = 'randomPermissionsforapiandstorage';

  const contextStub = {
    amplify: {
      invokePluginMethod: async () => {
        return { permissionPolicies, resourceAttributes };
      },
    },
  };
  expect(await getResourcesForCfn(contextStub, resourceName, {}, appsyncResourceName, 'storage')).toMatchSnapshot();
});

test('check CFN resources', async () => {
  const resourceAttributes = ['apiattr1', 'apiattr2'];
  const permissionPolicies = 'randomPermissionsforapi';

  const contextStub = {
    amplify: {
      invokePluginMethod: async () => {
        return { permissionPolicies, resourceAttributes };
      },
    },
  };
  expect(await getResourcesForCfn(contextStub, resourceName, {}, appsyncResourceName, 'api')).toMatchSnapshot();
});

test('env resources for CFN for DDB table and api', async () => {
  const contextStub = {
    print: {
      info: () => jest.fn,
    },
  };
  const resources = [
    {
      attributes: ['GraphQLAPIIdOutput'],
      category: 'api',
      resourceName: 'mock_api',
    },
  ];
  expect(await generateEnvVariablesForCfn(contextStub, resources, {})).toMatchSnapshot();
});

test('env resources for CFN for auth and storage for api', async () => {
  const contextStub = {
    print: {
      info: () => jest.fn,
    },
  };
  const resources = [
    {
      attributes: ['randombucket'],
      category: 'storage',
      resourceName: 'mock_api',
    },
    {
      attributes: ['userPoolId'],
      category: 'auth',
      resourceName: 'mock_api',
    },
  ];
  expect(await generateEnvVariablesForCfn(contextStub, resources, {})).toMatchSnapshot();
});
