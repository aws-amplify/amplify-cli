import { $TSContext } from 'amplify-cli-core';
import {
  getResourcesForCfn,
  generateEnvVariablesForCfn,
  askExecRolePermissionsQuestions,
} from '../../../../provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
import {
  constructCFModelTableNameComponent,
  constructCFModelTableArnComponent,
} from '../../../../provider-utils/awscloudformation/utils/cloudformationHelpers';
import { stateManager } from 'amplify-cli-core';
import { CRUDOperation } from '../../../../constants';
import inquirer from 'inquirer';

const backendDirPathStub = 'backendDirPath';

jest.mock('../../../../provider-utils/awscloudformation/utils/cloudformationHelpers');

jest.mock('amplify-cli-core', () => ({
  stateManager: {
    getMeta: jest.fn(),
  },
  FeatureFlags: {
    getBoolean: jest.fn().mockReturnValue(false),
  },
  pathManager: {
    getBackendDirPath: jest.fn(() => backendDirPathStub),
  },
}));

jest.mock('inquirer', () => {
  return {
    prompt: jest.fn(),
  };
});

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

describe('askExecRolePermissionsQuestions', () => {
  beforeEach(() => {
    const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
    stateManagerMock.getMeta.mockReturnValue({
      providers: {
        awscloudformation: {},
      },
      function: {
        lambda1: {
          service: 'Lambda',
          providerPlugin: 'awscloudformation',
        },
        lambda2: {
          service: 'Lambda',
          providerPlugin: 'awscloudformation',
          lastPushTimeStamp: '2021-07-12T00:41:17.966Z',
        },
      },
      auth: {
        authResourceName: {
          service: 'Cognito',
          serviceType: 'imported',
          providerPlugin: 'awscloudformation',
        },
      },
      storage: {
        s3Bucket: {
          service: 'S3',
          serviceType: 'imported',
          providerPlugin: 'awscloudformation',
        },
      },
    });
  });

  it('returns permissions for function that be about to add right', async () => {
    const inquirerMock = inquirer as jest.Mocked<typeof inquirer>;

    inquirerMock.prompt.mockResolvedValueOnce({ categories: ['function'] });
    inquirerMock.prompt.mockResolvedValueOnce({ resources: ['lambda2'] });
    inquirerMock.prompt.mockResolvedValueOnce({ options: [CRUDOperation.READ] });

    const resourceAttributes = [
      {
        attributes: ['Name'],
        category: 'function',
        resourceName: 'lambda2',
      },
    ];
    const permissionPolicies = [
      {
        Action: ['lambda:Get*', 'lambda:List*', 'lambda:Invoke*'],
        Effect: 'Allow',
        Resource: [
          {
            'Fn::Join': [
              '',
              ['arn:aws:lambda:', { Ref: 'AWS::Region' }, ':', { Ref: 'AWS::AccountId' }, ':function:', { Ref: 'functionlambda2Name' }],
            ],
          },
        ],
      },
    ];
    const contextStub = {
      print: {
        warning: jest.fn(),
        info: jest.fn(),
      },
      usageData: {
        emitError: jest.fn(),
      },
      amplify: {
        invokePluginMethod: jest.fn().mockResolvedValueOnce({ permissionPolicies, resourceAttributes }),
      },
    };
    const answers = await askExecRolePermissionsQuestions(contextStub as unknown as $TSContext, 'lambda3', undefined);
    expect(answers).toMatchSnapshot();
  });

  it('returns permissions for exists function', async () => {
    const inquirerMock = inquirer as jest.Mocked<typeof inquirer>;

    inquirerMock.prompt.mockResolvedValueOnce({ categories: ['function'] });
    inquirerMock.prompt.mockResolvedValueOnce({ options: [CRUDOperation.READ] });

    const resourceAttributes = [
      {
        attributes: ['Name'],
        category: 'function',
        resourceName: 'lambda2',
      },
    ];
    const permissionPolicies = [
      {
        Action: ['lambda:Get*', 'lambda:List*', 'lambda:Invoke*'],
        Effect: 'Allow',
        Resource: [
          {
            'Fn::Join': [
              '',
              ['arn:aws:lambda:', { Ref: 'AWS::Region' }, ':', { Ref: 'AWS::AccountId' }, ':function:', { Ref: 'functionlambda2Name' }],
            ],
          },
        ],
      },
    ];
    const contextStub = {
      print: {
        warning: jest.fn(),
        info: jest.fn(),
      },
      usageData: {
        emitError: jest.fn(),
      },
      amplify: {
        invokePluginMethod: jest.fn().mockResolvedValueOnce({ permissionPolicies, resourceAttributes }),
      },
    };
    const answers = await askExecRolePermissionsQuestions(contextStub as unknown as $TSContext, 'lambda1', undefined);
    expect(answers).toMatchSnapshot();
  });
});
