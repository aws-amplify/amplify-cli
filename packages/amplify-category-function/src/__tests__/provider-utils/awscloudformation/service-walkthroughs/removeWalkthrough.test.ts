describe('remove walkthough test', () => {
  let mockContext;
  const envName = 'testenv';
  const layerName = 'layerName';
  const module = __dirname + '/dummy_module';
  const deleteLayerVersionsMockFn = jest.fn();
  const loadLayerDataFromCloudMock = jest.fn();
  const loadStoredLayerParameters = jest.fn();
  const saveLayerVersionsToBeRemovedByCfn = jest.fn();
  const selectPromptMock = jest.fn();
  const updateLayerArtifacts = jest.fn();

  beforeEach(() => {
    mockContext = {
      print: {
        warning: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
      },
      amplify: {
        getProviderPlugins: jest.fn().mockReturnValue({ awscloudformation: module }),
      },
    };

    jest.mock('amplify-cli-core', () => ({
      promptConfirmationRemove: jest.fn().mockReturnValue(true),
      stateManager: {
        getLocalEnvInfo: jest.fn().mockReturnValue({ envName }),
      },
    }));

    jest.mock(module, () => ({
      getLambdaSdk: jest.fn().mockReturnValue({
        deleteLayerVersions: deleteLayerVersionsMockFn,
      }),
    }));

    jest.mock('../../../../provider-utils/awscloudformation/utils/layerConfiguration', () => ({
      saveLayerVersionsToBeRemovedByCfn: saveLayerVersionsToBeRemovedByCfn,
    }));

    jest.mock('../../../../provider-utils/awscloudformation/utils/layerHelpers', () => ({
      getLayerName: jest.fn().mockReturnValue(layerName),
      loadLayerDataFromCloud: loadLayerDataFromCloudMock,
      loadStoredLayerParameters: loadStoredLayerParameters,
    }));

    jest.mock('../../../../provider-utils/awscloudformation/utils/layerCloudState', () => ({
      LayerCloudState: {
        getInstance: jest.fn().mockReturnValue({
          getLayerVersionsFromCloud: loadLayerDataFromCloudMock,
        }),
      },
    }));

    jest.mock('../../../../provider-utils/awscloudformation/utils/storeResources', () => ({
      updateLayerArtifacts: updateLayerArtifacts,
    }));

    jest.mock('inquirer', () => ({
      prompt: selectPromptMock,
    }));
  });

  afterEach(() => {
    deleteLayerVersionsMockFn.mockClear();
    saveLayerVersionsToBeRemovedByCfn.mockClear();
    loadLayerDataFromCloudMock.mockClear();
    selectPromptMock.mockClear();
  });

  it('tests with legacy and new', async () => {
    const selectedlayerVersions = [
      {
        Version: 2,
        legacyLayer: true,
      },
      {
        Version: 3,
        legacyLayer: false,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue([
      ...selectedlayerVersions,
      {
        Version: 1,
        legacyLayer: true,
      },
    ]);
    selectPromptMock.mockReturnValue({ versions: selectedlayerVersions });
    const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough')
      .removeWalkthrough;
    const returnValue = await removeWalkthrough(mockContext, layerName);

    expect(returnValue).toBeUndefined();
    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalled();
    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalledWith(layerName, [3], envName);
    expect(deleteLayerVersionsMockFn).toBeCalled();
    expect(deleteLayerVersionsMockFn).toBeCalledWith(layerName, [2]);
  });

  it('tests with legacy', async () => {
    const selectedlayerVersions = [
      {
        Version: 2,
        legacyLayer: true,
      },
      {
        Version: 3,
        legacyLayer: true,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue([
      ...selectedlayerVersions,
      {
        Version: 1,
        legacyLayer: true,
      },
    ]);
    selectPromptMock.mockReturnValue({ versions: selectedlayerVersions });
    const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough')
      .removeWalkthrough;
    const returnValue = await removeWalkthrough(mockContext, layerName);

    expect(returnValue).toBeUndefined();
    expect(saveLayerVersionsToBeRemovedByCfn).not.toBeCalled();
    expect(deleteLayerVersionsMockFn).toBeCalled();
    expect(deleteLayerVersionsMockFn).toBeCalledWith(layerName, [2, 3]);
  });

  it('tests with new', async () => {
    const selectedlayerVersions = [
      {
        Version: 2,
        legacyLayer: false,
      },
      {
        Version: 3,
        legacyLayer: false,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue([
      ...selectedlayerVersions,
      {
        Version: 1,
        legacyLayer: true,
      },
    ]);
    selectPromptMock.mockReturnValue({ versions: selectedlayerVersions });
    const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough')
      .removeWalkthrough;
    const returnValue = await removeWalkthrough(mockContext, layerName);

    expect(returnValue).toBeUndefined();
    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalled();
    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalledWith(layerName, [2, 3], envName);
    expect(deleteLayerVersionsMockFn).not.toBeCalled();
  });

  it('all version selected', async () => {
    const selectedlayerVersions = [
      {
        Version: 2,
        legacyLayer: false,
      },
      {
        Version: 3,
        legacyLayer: false,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue(selectedlayerVersions);
    selectPromptMock.mockReturnValue({ versions: selectedlayerVersions });
    const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough')
      .removeWalkthrough;
    const returnValue = await removeWalkthrough(mockContext, layerName);

    expect(returnValue).toBeDefined();
    expect(saveLayerVersionsToBeRemovedByCfn).not.toBeCalled();
    expect(deleteLayerVersionsMockFn).not.toBeCalled();
  });

  it('no version selected', async () => {
    const selectedlayerVersions = [
      {
        Version: 2,
        legacyLayer: false,
      },
      {
        Version: 3,
        legacyLayer: false,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue(selectedlayerVersions);
    selectPromptMock.mockReturnValue({ versions: [] });
    const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough')
      .removeWalkthrough;
    const returnValue = await removeWalkthrough(mockContext, layerName);

    expect(returnValue).toBeUndefined();
    expect(saveLayerVersionsToBeRemovedByCfn).not.toBeCalled();
    expect(deleteLayerVersionsMockFn).not.toBeCalled();
  });
});
