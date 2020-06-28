import {
  askLayerSelection,
  provideExistingARNsPrompt,
  askCustomArnQuestion,
  askLayerOrderQuestion,
} from '../../../../provider-utils/awscloudformation/utils/addLayerToFunctionUtils';
import inquirer, { CheckboxQuestion, ListQuestion, InputQuestion } from 'inquirer';
import enquirer from 'enquirer';
import { ServiceName } from '../../../../provider-utils/awscloudformation/utils/constants';
import { LambdaLayer, FunctionDependency } from 'amplify-function-plugin-interface';
import { category } from '../../../../constants';
import { LayerMetadataFactory } from '../../../../provider-utils/awscloudformation/utils/layerParams';

jest.mock('inquirer');
jest.mock('enquirer', () => ({ prompt: jest.fn() }));
jest.mock('../../../../provider-utils/awscloudformation/utils/layerParams');

const inquirer_mock = inquirer as jest.Mocked<typeof inquirer>;
const enquirer_mock = enquirer as jest.Mocked<typeof enquirer>;
const layerMetadataFactory_stub: LayerMetadataFactory = () =>
  ({
    listVersions: () => [3, 2, 1],
    syncVersions: async () => true,
  } as any);

const runtimeValue = 'lolcode';

const backendDirPath = 'randomvalue';

const layerName = 'randomLayer';

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
  },
];

describe('layer selection question', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty and prompts for arns when no layers available', async () => {
    const amplifyMetaStub = {};
    const result = await askLayerSelection(layerMetadataFactory_stub, amplifyMetaStub, runtimeValue);
    expect(result.lambdaLayers).toStrictEqual([]);
    expect(result.dependsOn).toStrictEqual([]);
    expect(result.askArnQuestion).toBe(true);
  });

  it('sets default layer choices based on previous selections', async () => {
    (inquirer_mock.prompt as any).mockImplementation(() => ({
      layerSelections: [],
    }));

    const result = await askLayerSelection(layerMetadataFactory_stub, amplifyMetaStub, runtimeValue, previousSelectionsStub);
    expect((inquirer_mock.prompt.mock.calls[0][0] as CheckboxQuestion).choices[1].checked).toBe(true);
  });

  it('sets askArnQuestion to true when the customer selects the option', async () => {
    (inquirer_mock.prompt as any).mockImplementation(() => ({
      layerSelections: [provideExistingARNsPrompt],
    }));

    const result = await askLayerSelection(layerMetadataFactory_stub, amplifyMetaStub, runtimeValue);
    expect(result.askArnQuestion).toBe(true);
  });

  it('sets the default version for each layer to the previous selection', async () => {
    (inquirer_mock.prompt as any).mockImplementationOnce(() => ({
      layerSelections: ['aLayer'],
    }));
    (inquirer_mock.prompt as any).mockImplementationOnce(() => ({
      versionSelection: 2,
    }));

    await askLayerSelection(layerMetadataFactory_stub, amplifyMetaStub, runtimeValue, previousSelectionsStub);
    expect((inquirer_mock.prompt.mock.calls[1][0] as ListQuestion).default).toBe('2');
  });

  it('returns the selected layers', async () => {
    (inquirer_mock.prompt as any).mockImplementationOnce(() => ({
      layerSelections: [provideExistingARNsPrompt, 'aLayer'],
    }));
    (inquirer_mock.prompt as any).mockImplementationOnce(() => ({
      versionSelection: 2,
    }));

    const result = await askLayerSelection(layerMetadataFactory_stub, amplifyMetaStub, runtimeValue);
    const expectedLambdaLayers: LambdaLayer[] = [
      {
        type: 'ProjectLayer',
        resourceName: 'aLayer',
        version: 2,
      },
    ];
    const expectedDependsOn: FunctionDependency[] = [
      {
        category,
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
    (inquirer_mock.prompt as any).mockImplementationOnce(() => ({
      arns: [],
    }));
    await askCustomArnQuestion(1, previousSelectionsStub);
    expect((inquirer_mock.prompt.mock.calls[0][0] as InputQuestion).default).toBe('someArn');
  });
  it('returns ARNs as LambdaLayer array', async () => {
    (inquirer_mock.prompt as any).mockImplementationOnce(() => ({
      arns: ['arn1', 'arn2'],
    }));
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
    enquirer_mock.prompt.mockImplementation(async () => ({
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
      },
      {
        type: 'ProjectLayer',
        resourceName: 'anotherLayer',
        version: 1,
      },
    ];

    const previousSelectionsStub: LambdaLayer[] = [
      {
        type: 'ProjectLayer',
        resourceName: 'myLayer',
        version: 2,
      },
      {
        type: 'ExternalLayer',
        arn: 'someArn',
      },
    ];

    await askLayerOrderQuestion(currentSelectionsStub, previousSelectionsStub);
    const presentedOrder = (enquirer_mock.prompt.mock.calls[0][0] as any).choices as string[];
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
      },
      {
        type: 'ProjectLayer',
        resourceName: 'anotherLayer',
        version: 1,
      },
    ];

    const expectedResultOrder: LambdaLayer[] = [
      {
        type: 'ProjectLayer',
        resourceName: 'myLayer',
        version: 2,
      },
      {
        type: 'ProjectLayer',
        resourceName: 'anotherLayer',
        version: 1,
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
    expect(enquirer_mock.prompt.mock.calls.length).toBe(0);
    expect(result).toStrictEqual(currentSelectionsStub);
  });
});
