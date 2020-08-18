import {
  askLayerSelection,
  askCustomArnQuestion,
  askLayerOrderQuestion,
} from '../../../../provider-utils/awscloudformation/utils/addLayerToFunctionUtils';
import { addLayersToFunctionWalkthrough } from '../../../../provider-utils/awscloudformation/service-walkthroughs/addLayerToFunctionWalkthrough';
import { LambdaLayer, FunctionDependency } from 'amplify-function-plugin-interface';
import { loadProjectLayers } from '../../../../provider-utils/awscloudformation/utils/loadProjectLayers';

jest.mock('../../../../provider-utils/awscloudformation/utils/addLayerToFunctionUtils');
jest.mock('../../../../provider-utils/awscloudformation/utils/loadProjectLayers');

const askLayerSelection_mock = askLayerSelection as jest.MockedFunction<typeof askLayerSelection>;
const askCustomArnQuestion_mock = askCustomArnQuestion as jest.MockedFunction<typeof askCustomArnQuestion>;
const askLayerOrderQuestion_mock = askLayerOrderQuestion as jest.MockedFunction<typeof askLayerOrderQuestion>;
const loadProjectLayers_mock = loadProjectLayers as jest.MockedFunction<typeof loadProjectLayers>;

const confirmPromptFalse_mock = jest.fn(() => false);
const confirmPromptTrue_mock = jest.fn(() => true);
const getContextStubWith = (prompt: jest.Mock) => ({
  amplify: {
    confirmPrompt: prompt,
    getProjectMeta: () => {},
    pathManager: {
      getBackendDirPath: () => {},
    },
  },
});

const featureFlagsStub: any = {
  getBoolean: (flag: string) => flag === 'lambdaLayers.multiEnv',
};

const runtimeStub = {
  value: 'lolcode', // http://www.lolcode.org/
};

const layerSelectionStub: LambdaLayer[] = [
  {
    type: 'ProjectLayer',
    resourceName: 'myLayer',
    version: 10,
  },
  {
    type: 'ProjectLayer',
    resourceName: 'anotherLayer',
    version: 123498,
  },
];

const arnEntryStub: LambdaLayer[] = [
  {
    type: 'ExternalLayer',
    arn: 'superCoolArn',
  },
  {
    type: 'ExternalLayer',
    arn: 'literalGarbage',
  },
];

const dependsOnStub: FunctionDependency[] = [
  {
    category: 'aCategory',
    resourceName: 'myLayer',
    attributes: ['AnAttribute'],
  },
];

const previousSelectionsStub: LambdaLayer[] = [
  {
    type: 'ExternalLayer',
    arn: 'previousARN',
  },
];

askLayerSelection_mock.mockImplementation(async () => ({
  lambdaLayers: layerSelectionStub,
  dependsOn: dependsOnStub,
  askArnQuestion: false,
}));

askCustomArnQuestion_mock.mockImplementation(async () => arnEntryStub);

askLayerOrderQuestion_mock.mockImplementation(async layers => layers);

loadProjectLayers_mock.mockImplementation(async () => {
  return {
    aLayer: {
      runtimes: [],
    },
  };
});

describe('add layer to function walkthrough', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty layers and dependsOn if the customer does not want to add layers', async () => {
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptFalse_mock), runtimeStub, [], featureFlagsStub);

    expect(confirmPromptFalse_mock.mock.calls.length).toBe(1);
    expect(askLayerSelection_mock.mock.calls.length).toBe(0);

    expect(result.lambdaLayers).toStrictEqual([]);
    expect(result.dependsOn).toStrictEqual([]);
  });

  it('asks the layer selection question', async () => {
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub, [], featureFlagsStub);

    expect(confirmPromptTrue_mock.mock.calls.length).toBe(1);
    expect(askLayerSelection_mock.mock.calls.length).toBe(1);
    expect(askLayerOrderQuestion_mock.mock.calls.length).toBe(1);

    expect(result.lambdaLayers).toStrictEqual(layerSelectionStub);
    expect(result.dependsOn).toStrictEqual(dependsOnStub);
  });

  it('only asks for ARNs if the customer selects the option', async () => {
    askLayerSelection_mock.mockImplementation(async () => ({
      lambdaLayers: layerSelectionStub,
      dependsOn: dependsOnStub,
      askArnQuestion: true,
    }));
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub, [], featureFlagsStub);

    expect(askCustomArnQuestion_mock.mock.calls.length).toBe(1);
    const expectedLayers = layerSelectionStub.concat(arnEntryStub);
    expect(result.lambdaLayers).toStrictEqual(expectedLayers);
  });

  it('asks to reorder the selected layers', async () => {
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub, [], featureFlagsStub);

    expect(askLayerOrderQuestion_mock.mock.calls.length).toBe(1);
  });

  it('uses previous selections to populate default selections', async () => {
    await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub, previousSelectionsStub, featureFlagsStub);

    expect(askLayerSelection_mock.mock.calls[0][3]).toStrictEqual(previousSelectionsStub);
    expect(askLayerOrderQuestion_mock.mock.calls[0][1]).toStrictEqual(previousSelectionsStub);
  });
});
