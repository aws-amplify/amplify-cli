import {
  generateIterativeFuncDeploymentSteps,
  generateTempFuncCFNTemplates,
  getDependentFunctions,
  prependDeploymentSteps,
  uploadTempFuncDeploymentFiles,
} from '../../disconnect-dependent-resources/utils';
import { pathManager, stateManager, readCFNTemplate, writeCFNTemplate, CFNTemplateFormat } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import { S3 } from '../../aws-utils/aws-s3';
import { getPreviousDeploymentRecord } from '../../utils/amplify-resource-state-utils';
import Template from 'cloudform-types/types/template';
import { DeploymentOp, DeploymentStep } from '../../iterative-deployment';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';

jest.mock('fs-extra');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../utils/amplify-resource-state-utils');

const fs_mock = fs as jest.Mocked<typeof fs>;
const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
const readCFNTemplate_mock = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;
const writeCFNTemplate_mock = writeCFNTemplate as jest.MockedFunction<typeof writeCFNTemplate>;

const getPreviousDeploymentRecord_mock = getPreviousDeploymentRecord as jest.MockedFunction<typeof getPreviousDeploymentRecord>;

pathManager_mock.getResourceDirectoryPath.mockReturnValue('mock/path');

beforeEach(jest.clearAllMocks);

describe('getDependentFunctions', () => {
  it('returns the subset of functions that have a dependency on the models', async () => {
    const func1Params = {
      permissions: {
        storage: {
          someOtherTable: {},
        },
      },
    };
    const func2Params = {
      permissions: {
        storage: {
          ['ModelName:@model(appsync)']: {},
        },
      },
    };
    const funcParamsSupplier = jest.fn().mockReturnValueOnce(func1Params).mockReturnValueOnce(func2Params);
    const result = await getDependentFunctions(['ModelName', 'OtherModel'], ['func1', 'func2'], funcParamsSupplier);
    expect(result).toEqual(['func2']);
  });
});

describe('generateTempFuncCFNTemplates', () => {
  readCFNTemplate_mock.mockReturnValueOnce({
    cfnTemplate: {
      a: {
        b: {
          c: [
            {
              'Fn::ImportValue': {
                'Fn::Sub': 'test string',
              },
            },
            {
              'Fn::Join': [
                ':',
                {
                  'Fn::ImportValue': 'testvalue',
                },
              ],
            },
          ],
        },
        d: {
          'Fn::ImportValue': 'something else',
        },
      },
    } as Template,
    templateFormat: CFNTemplateFormat.JSON,
  });
  it('replaces Fn::ImportValue references with placeholder values in template', async () => {
    await generateTempFuncCFNTemplates(['func1']);
    expect(writeCFNTemplate_mock.mock.calls[0][0]).toMatchSnapshot();
  });
});

describe('uploadTempFuncDeploymentFiles', () => {
  it('uploads template and meta file', async () => {
    fs_mock.createReadStream
      .mockReturnValueOnce('func1Template' as any)
      .mockReturnValueOnce('func1Meta' as any)
      .mockReturnValueOnce('func2Template' as any)
      .mockReturnValueOnce('func2Meta' as any);
    const s3Client_stub = {
      uploadFile: jest.fn(),
    };

    await uploadTempFuncDeploymentFiles(s3Client_stub as unknown as S3, ['func1', 'func2']);
    expect(s3Client_stub.uploadFile.mock.calls).toMatchInlineSnapshot(`
[
  [
    {
      "Body": "func1Template",
      "Key": "amplify-cfn-templates/function/temp/temp-func1-cloudformation-template.json",
    },
    false,
  ],
  [
    {
      "Body": "func1Meta",
      "Key": "amplify-cfn-templates/function/temp/temp-func1-deployment-meta.json",
    },
    false,
  ],
  [
    {
      "Body": "func2Template",
      "Key": "amplify-cfn-templates/function/temp/temp-func2-cloudformation-template.json",
    },
    false,
  ],
  [
    {
      "Body": "func2Meta",
      "Key": "amplify-cfn-templates/function/temp/temp-func2-deployment-meta.json",
    },
    false,
  ],
]
`);
  });

  it('logs and throws upload error', async () => {
    const s3Client_stub = {
      uploadFile: jest.fn().mockRejectedValue(new Error('test error')),
    };
    try {
      await uploadTempFuncDeploymentFiles(s3Client_stub as unknown as S3, ['func1', 'func2']);
      fail('function call should error');
    } catch (err) {
      expect(err.message).toMatchInlineSnapshot(`"test error"`);
    }
  });
});

describe('generateIterativeFuncDeploymentSteps', () => {
  it('generates steps with correct pointers', async () => {
    const cfnClient_stub = {
      send: () => ({
        StackResources: [
          {
            PhysicalResourceId: 'testStackId',
          },
        ],
      }),
    };
    getPreviousDeploymentRecord_mock
      .mockResolvedValueOnce({
        parameters: {
          param1: 'value1',
        },
        capabilities: [],
      })
      .mockResolvedValueOnce({
        parameters: {
          param2: 'value2',
        },
        capabilities: [],
      });
    stateManager_mock.getResourceParametersJson.mockReturnValue({});
    stateManager_mock.getTeamProviderInfo.mockReturnValue({});
    stateManager_mock.getLocalEnvInfo.mockReturnValue({ envName: 'testenv' });
    const result = await generateIterativeFuncDeploymentSteps(cfnClient_stub as unknown as CloudFormationClient, 'testRootStackId', [
      'func1',
      'func2',
    ]);
    expect(result).toMatchSnapshot();
  });
});

describe('prependDeploymentSteps', () => {
  it('concatenates arrays and moves pointers appropriately', () => {
    const beforeSteps: DeploymentStep[] = [
      {
        deployment: {
          stackTemplatePathOrUrl: 'deploymentStep1',
          previousMetaKey: undefined,
        } as DeploymentOp,
        rollback: undefined,
      },
      {
        deployment: {
          stackTemplatePathOrUrl: 'deploymentStep2',
          previousMetaKey: 'deploymentStep1MetaKey',
        } as DeploymentOp,
        rollback: {
          stackTemplatePathOrUrl: 'deploymentStep1',
          previousMetaKey: undefined,
        } as DeploymentOp,
      },
    ];

    const afterSteps: DeploymentStep[] = [
      {
        deployment: {
          stackTemplatePathOrUrl: 'deploymentStep3',
          previousMetaKey: undefined,
        } as DeploymentOp,
        rollback: undefined,
      },
      {
        deployment: {
          stackTemplatePathOrUrl: 'deploymentStep4',
          previousMetaKey: 'deploymentStep3MetaKey',
        } as DeploymentOp,
        rollback: {
          stackTemplatePathOrUrl: 'deploymentStep3',
          previousMetaKey: undefined,
        } as DeploymentOp,
      },
    ];

    const result = prependDeploymentSteps(beforeSteps, afterSteps, 'deploymentStep2MetaKey');
    expect(result).toMatchSnapshot();
  });

  it('returns after array if before array is empty', () => {
    const afterSteps = ['test step' as unknown as DeploymentStep];
    const result = prependDeploymentSteps([], afterSteps, 'testmetakey');
    expect(result).toEqual(afterSteps);
  });
});
