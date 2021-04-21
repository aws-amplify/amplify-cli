import { $TSContext, stateManager } from 'amplify-cli-core';
import { FunctionDependency, LambdaLayer } from 'amplify-function-plugin-interface';
import { addLayersToFunctionWalkthrough } from '../../../../provider-utils/awscloudformation/service-walkthroughs/addLayerToFunctionWalkthrough';
import {
  askCustomArnQuestion,
  askLayerOrderQuestion,
  askLayerSelection,
} from '../../../../provider-utils/awscloudformation/utils/addLayerToFunctionUtils';
import { loadLayerDataFromCloud } from '../../../../provider-utils/awscloudformation/utils/layerHelpers';
import { LayerVersionMetadata } from '../../../../provider-utils/awscloudformation/utils/layerParams';

jest.mock('../../../../provider-utils/awscloudformation/utils/addLayerToFunctionUtils');
jest.mock('../../../../provider-utils/awscloudformation/utils/layerHelpers');
jest.mock('amplify-cli-core');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getMeta.mockReturnValue({
  providers: {
    awscloudformation: {
      Region: 'myMockRegion',
    },
  },
  function: {
    testFunc: {
      lastBuildTimeStamp: 'lastBuildTimeStamp',
      lastDevBuildTimeStamp: 'lastDevBuildTimeStamp',
    },
  },
});

const askLayerSelection_mock = askLayerSelection as jest.MockedFunction<typeof askLayerSelection>;
const askCustomArnQuestion_mock = askCustomArnQuestion as jest.MockedFunction<typeof askCustomArnQuestion>;
const askLayerOrderQuestion_mock = askLayerOrderQuestion as jest.MockedFunction<typeof askLayerOrderQuestion>;

const loadLayerDataFromCloud_mock = loadLayerDataFromCloud as jest.MockedFunction<typeof loadLayerDataFromCloud>;

const confirmPromptFalse_mock = jest.fn(() => false);
const confirmPromptTrue_mock = jest.fn(() => true);
const getContextStubWith = (prompt: jest.Mock) =>
  (({
    amplify: {
      confirmPrompt: prompt,
      getProjectMeta: () => {},
      pathManager: {
        getBackendDirPath: () => {},
      },
    },
  } as unknown) as $TSContext);

const runtimeStub = {
  value: 'lolcode', // http://www.lolcode.org/
};

const layerCloudReturnStub: LayerVersionMetadata[] = [
  {
    LayerVersionArn: 'fakeArn1',
    Description: '',
    CreatedDate: '',
    CompatibleRuntimes: ['nodejs14.x'],
    LicenseInfo: '',
    permissions: [],
    LogicalName: 'myLayer',
    Version: 10,
    LegacyLayer: true,
  },
  {
    LogicalName: 'anotherLayer',
    Version: 123498,
    LayerVersionArn: 'fakeArn2',
    Description: '',
    CreatedDate: '',
    CompatibleRuntimes: ['nodejs14.x'],
    LicenseInfo: '',
    permissions: [],
    LegacyLayer: true,
  },
];

const layerSelectionStub: LambdaLayer[] = [
  {
    type: 'ProjectLayer',
    resourceName: 'myLayer',
    version: 10,
    isLatestVersionSelected: false,
    env: 'mockEnv',
  },
  {
    type: 'ProjectLayer',
    resourceName: 'anotherLayer',
    version: 123498,
    isLatestVersionSelected: false,
    env: 'mockEnv',
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

loadLayerDataFromCloud_mock.mockImplementation(async () => layerCloudReturnStub);

describe('add layer to function walkthrough', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty layers and dependsOn if the customer does not want to add layers', async () => {
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptFalse_mock), runtimeStub);

    expect(confirmPromptFalse_mock.mock.calls.length).toBe(1);
    expect(askLayerSelection_mock.mock.calls.length).toBe(0);

    expect(result.lambdaLayers).toStrictEqual([]);
    expect(result.dependsOn).toStrictEqual([]);
  });

  it('asks the layer selection question', async () => {
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub);

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
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub);

    expect(askCustomArnQuestion_mock.mock.calls.length).toBe(1);
    const expectedLayers = layerSelectionStub.concat(arnEntryStub);
    expect(result.lambdaLayers).toStrictEqual(expectedLayers);
  });

  it('asks to reorder the selected layers', async () => {
    const result = await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub);

    expect(askLayerOrderQuestion_mock.mock.calls.length).toBe(1);
  });

  it('uses previous selections to populate default selections', async () => {
    await addLayersToFunctionWalkthrough(getContextStubWith(confirmPromptTrue_mock), runtimeStub, previousSelectionsStub);

    expect(askLayerSelection_mock.mock.calls[0][3]).toStrictEqual(previousSelectionsStub);
    expect(askLayerOrderQuestion_mock.mock.calls[0][1]).toStrictEqual(previousSelectionsStub);
  });
});
