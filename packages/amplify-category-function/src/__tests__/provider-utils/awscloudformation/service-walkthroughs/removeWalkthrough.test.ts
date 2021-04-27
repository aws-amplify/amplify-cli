describe('remove walkthough test', () => {
  let mockContext;
  const envName = 'testenv';
  const layerName = 'layerName';
  const module = __dirname + '/dummy_module';
  const deleteLayerVersionsMockFn = jest.fn();
  const saveLayerVersionsToBeRemovedByCfn = jest.fn();
  const loadLayerDataFromCloudMock = jest.fn();
  const selectPromptMock = jest.fn();
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
      loadLayerDataFromCloud: loadLayerDataFromCloudMock,
      getLayerName: jest.fn().mockReturnValue(layerName),
    }));

    jest.mock('../../../../provider-utils/awscloudformation/utils/layerCloudState', () => ({
      LayerCloudState: {
        getInstance: jest.fn().mockReturnValue({
          getLayerVersionsFromCloud: loadLayerDataFromCloudMock,
        }),
      },
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
        LegacyLayer: true,
      },
      {
        Version: 3,
        LegacyLayer: false,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue([
      ...selectedlayerVersions,
      {
        Version: 1,
        LegacyLayer: true,
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
        LegacyLayer: true,
      },
      {
        Version: 3,
        LegacyLayer: true,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue([
      ...selectedlayerVersions,
      {
        Version: 1,
        LegacyLayer: true,
      },
    ]);
    selectPromptMock.mockReturnValue({ versions: selectedlayerVersions });
    const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough')
      .removeWalkthrough;
    const returnValue = await removeWalkthrough(mockContext, layerName);
    expect(returnValue).toBeUndefined();
    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalled();

    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalledWith(layerName, [], envName);
    expect(deleteLayerVersionsMockFn).toBeCalled();
    expect(deleteLayerVersionsMockFn).toBeCalledWith(layerName, [2, 3]);
  });

  it('tests with new', async () => {
    const selectedlayerVersions = [
      {
        Version: 2,
        LegacyLayer: false,
      },
      {
        Version: 3,
        LegacyLayer: false,
      },
    ];

    loadLayerDataFromCloudMock.mockReturnValue([
      ...selectedlayerVersions,
      {
        Version: 1,
        LegacyLayer: true,
      },
    ]);
    selectPromptMock.mockReturnValue({ versions: selectedlayerVersions });
    const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough')
      .removeWalkthrough;
    const returnValue = await removeWalkthrough(mockContext, layerName);
    expect(returnValue).toBeUndefined();
    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalled();

    expect(saveLayerVersionsToBeRemovedByCfn).toBeCalledWith(layerName, [2, 3], envName);
    expect(deleteLayerVersionsMockFn).toBeCalled();
    expect(deleteLayerVersionsMockFn).toBeCalledWith(layerName, []);
  });

  it('all version selected', async () => {
    const selectedlayerVersions = [
      {
        Version: 2,
        LegacyLayer: false,
      },
      {
        Version: 3,
        LegacyLayer: false,
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
        LegacyLayer: false,
      },
      {
        Version: 3,
        LegacyLayer: false,
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
