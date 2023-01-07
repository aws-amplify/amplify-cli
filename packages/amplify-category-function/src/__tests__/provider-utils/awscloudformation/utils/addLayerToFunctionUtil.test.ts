import { $TSContext } from 'amplify-cli-core';
import { FunctionDependency, LambdaLayer } from 'amplify-function-plugin-interface';
import enquirer from 'enquirer';
import { categoryName } from '../../../../constants';
import {
  askCustomArnQuestion,
  askLayerOrderQuestion,
  askLayerSelection,
  provideExistingARNsPrompt,
} from '../../../../provider-utils/awscloudformation/utils/addLayerToFunctionUtils';
import { ServiceName } from '../../../../provider-utils/awscloudformation/utils/constants';
import { getLayerRuntimes } from '../../../../provider-utils/awscloudformation/utils/layerConfiguration';
import { LayerCloudState } from '../../../../provider-utils/awscloudformation/utils/layerCloudState';
import { LayerVersionMetadata } from '../../../../provider-utils/awscloudformation/utils/layerParams';
import { prompter } from 'amplify-prompts';

jest.mock('amplify-prompts');
jest.mock('enquirer', () => ({ prompt: jest.fn() }));
jest.mock('../../../../provider-utils/awscloudformation/utils/layerHelpers');
jest.mock('../../../../provider-utils/awscloudformation/utils/layerCloudState');
jest.mock('../../../../provider-utils/awscloudformation/utils/layerConfiguration', () => ({
  getLayerRuntimes: jest.fn(),
}));
jest.mock('../../../../provider-utils/awscloudformation/utils/layerMigrationUtils');

const getLayerRuntimeMock = getLayerRuntimes as jest.MockedFunction<typeof getLayerRuntimes>;
const prompterMock = prompter as jest.Mocked<typeof prompter>;
const enquirerMock = enquirer as jest.Mocked<typeof enquirer>;

const context_stub = ({
  amplify: {
    getEnvInfo: jest.fn().mockReturnValue({ envName: 'mockEnv' }),
    getProviderPlugins: jest.fn(),
  },
} as unknown) as $TSContext;

const runtimeValue = 'lolcode';

const amplifyMetaStub = {
  function: {
    aLayer: {
      service: ServiceName.LambdaLayer,
      runtimes: [
        {
          value: runtimeValue,
        },
      ],
    },
  },
};

const previousSelectionsStub: LambdaLayer[] = [
  {
    type: 'ProjectLayer',
    resourceName: 'aLayer',
    version: 2,
    isLatestVersionSelected: false,
    env: 'mockEnv',
  },
];

getLayerRuntimeMock.mockImplementation(() => {
  return [
    {
      name: 'NodeJs',
      value: 'nodejs',
      layerExecutablePath: 'nodejs/node_modules',
      cloudTemplateValue: 'nodejs14.x',
    },
  ];
});

const layerCloudReturnStub: LayerVersionMetadata[] = [
  {
    LayerVersionArn: 'fakeArn1',
    Description: '',
    CreatedDate: '',
    CompatibleRuntimes: ['nodejs14.x'],
    LicenseInfo: '',
    permissions: [],
    LogicalName: 'myLayer',
    Version: 1,
    legacyLayer: false,
  },
  {
    LogicalName: 'aLayer',
    Version: 2,
    LayerVersionArn: 'fakeArn2',
    Description: '',
    CreatedDate: '',
    CompatibleRuntimes: ['nodejs14.x'],
    LicenseInfo: '',
    permissions: [],
    legacyLayer: false,
  },
];

const layerCloudState_mock = LayerCloudState as jest.Mocked<typeof LayerCloudState>;
layerCloudState_mock.getInstance.mockReturnValue(({
  getLayerVersionsFromCloud: jest.fn(async () => layerCloudReturnStub),
  latestVersionLogicalId: 'mockLogicalId',
} as unknown) as LayerCloudState);

describe('layer selection question', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty and prompts for arns when no layers available', async () => {
    const amplifyMetaStub = {};
    const result = await askLayerSelection(context_stub, amplifyMetaStub, runtimeValue, []);
    expect(result.lambdaLayers).toStrictEqual([]);
    expect(result.dependsOn).toStrictEqual([]);
    expect(result.askArnQuestion).toBe(true);
  });

  it('sets default layer choices based on previous selections', async () => {
    (prompterMock.pick as any).mockImplementation(() => []);

    await askLayerSelection(context_stub, amplifyMetaStub, runtimeValue, previousSelectionsStub);
    expect((prompterMock.pick.mock.calls[0][0][1] as any).checked).toBe(true);
  });

  it('sets askArnQuestion to true when the customer selects the option', async () => {
    (prompterMock.pick as any).mockImplementation(() => []);

    const result = await askLayerSelection(context_stub, amplifyMetaStub, runtimeValue, []);
    expect(result.askArnQuestion).toBe(true);
  });

  it('returns the selected layers', async () => {
    (prompterMock.pick as any).mockImplementationOnce(() => [provideExistingARNsPrompt, 'aLayer']);
    (prompterMock.pick as any).mockImplementationOnce(() => `${2}: layer description`);

    const result = await askLayerSelection(context_stub, amplifyMetaStub, runtimeValue, []);
    const expectedLambdaLayers: LambdaLayer[] = [
      {
        type: 'ProjectLayer',
        resourceName: 'aLayer',
        version: 2,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
    ];
    const expectedDependsOn: FunctionDependency[] = [
      {
        category: categoryName,
        resourceName: 'aLayer',
        attributes: ['Arn'],
      },
    ];
    expect(result.lambdaLayers).toStrictEqual(expectedLambdaLayers);
    expect(result.dependsOn).toStrictEqual(expectedDependsOn);
    expect(result.askArnQuestion).toBe(true);
  });
});

describe('custom arn question', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets default ARNs to previous values', async () => {
    const previousSelectionsStub: LambdaLayer[] = [
      {
        type: 'ExternalLayer',
        arn: 'someArn',
      },
    ];
    (prompterMock.pick as any).mockImplementationOnce(() => []); // arns
    await askCustomArnQuestion(1, previousSelectionsStub);
    expect(prompterMock.input.mock.calls[0][0]).toBe('someArn');
  });

  it('returns ARNs as LambdaLayer array', async () => {
    (prompterMock.pick as any).mockImplementationOnce(() => ['arn1', 'arn2']);
    const result = await askCustomArnQuestion(1, previousSelectionsStub);
    const expectedResult: LambdaLayer[] = [
      {
        type: 'ExternalLayer',
        arn: 'arn1',
      },
      {
        type: 'ExternalLayer',
        arn: 'arn2',
      },
    ];
    expect(result).toStrictEqual(expectedResult);
  });
});

describe('layer order question', () => {
  beforeAll(() => {
    enquirerMock.prompt.mockImplementation(async () => ({
      sortedNames: ['myLayer', 'anotherLayer', 'someArn'],
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('orders list based on previous selections', async () => {
    const currentSelectionsStub: LambdaLayer[] = [
      {
        type: 'ExternalLayer',
        arn: 'someArn',
      },
      {
        type: 'ProjectLayer',
        resourceName: 'myLayer',
        version: 2,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
      {
        type: 'ProjectLayer',
        resourceName: 'anotherLayer',
        version: 1,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
    ];

    const previousSelectionsStub: LambdaLayer[] = [
      {
        type: 'ProjectLayer',
        resourceName: 'myLayer',
        version: 2,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
      {
        type: 'ExternalLayer',
        arn: 'someArn',
      },
    ];

    await askLayerOrderQuestion(currentSelectionsStub, previousSelectionsStub);
    const presentedOrder = (enquirerMock.prompt.mock.calls[0][0] as any).choices as string[];
    expect(presentedOrder).toStrictEqual(['myLayer', 'someArn', 'anotherLayer']);
  });

  it('returns customer-defined ordering of layers', async () => {
    const currentSelectionsStub: LambdaLayer[] = [
      {
        type: 'ExternalLayer',
        arn: 'someArn',
      },
      {
        type: 'ProjectLayer',
        resourceName: 'myLayer',
        version: 2,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
      {
        type: 'ProjectLayer',
        resourceName: 'anotherLayer',
        version: 1,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
    ];

    const expectedResultOrder: LambdaLayer[] = [
      {
        type: 'ProjectLayer',
        resourceName: 'myLayer',
        version: 2,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
      {
        type: 'ProjectLayer',
        resourceName: 'anotherLayer',
        version: 1,
        isLatestVersionSelected: false,
        env: 'mockEnv',
      },
      {
        type: 'ExternalLayer',
        arn: 'someArn',
      },
    ];
    const result = await askLayerOrderQuestion(currentSelectionsStub);
    expect(result).toStrictEqual(expectedResultOrder);
  });

  it('does not prompt for order when only one selection', async () => {
    const currentSelectionsStub: LambdaLayer[] = [
      {
        type: 'ExternalLayer',
        arn: 'someArn',
      },
    ];
    const result = await askLayerOrderQuestion(currentSelectionsStub);
    expect(enquirerMock.prompt.mock.calls.length).toBe(0);
    expect(result).toStrictEqual(currentSelectionsStub);
  });
});
