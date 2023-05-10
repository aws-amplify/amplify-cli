import { $TSContext, $TSObject, stateManager, pathManager, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { EsriMapStyleType, getGeoMapStyle, MapParameters, MapStyle } from '../../service-utils/mapParams';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';
import { provider, ServiceName, apiDocs } from '../../service-utils/constants';
import { category } from '../../constants';
import { createMapWalkthrough, updateMapWalkthrough } from '../../service-walkthroughs/mapWalkthrough';
import { removeWalkthrough } from '../../service-walkthroughs/removeWalkthrough';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');

describe('Map walkthrough works as expected', () => {
  const projectName = 'mockProject';
  const service = ServiceName.Map;
  const mockMapName = 'mockmap12345';
  const secondaryMapName = 'secondarymap12345';
  const mockUserPoolGroup = 'mockCognitoGroup';
  const mockMapResource = {
    resourceName: mockMapName,
    service,
    mapStyle: MapStyle.VectorEsriStreets,
  };
  const secondaryMapResource = {
    resourceName: secondaryMapName,
    service,
    isDefault: false,
    mapStyle: MapStyle.VectorEsriStreets,
  };
  const mockPlaceIndexResource = {
    resourceName: 'placeIndex12345',
    service: ServiceName.PlaceIndex,
  };

  const mockMapParameters: MapParameters = {
    providerContext: {
      provider,
      service,
      projectName,
    },
    name: mockMapName,
    mapStyleType: EsriMapStyleType.Streets,
    dataProvider: DataProvider.Esri,
    accessType: AccessType.AuthorizedUsers,
    isDefault: false,
    groupPermissions: [mockUserPoolGroup],
  };

  const mockContext = {
    amplify: {
      serviceSelectionPrompt: async () => ({ service, providerName: provider }),
      inputValidation: jest.fn(),
      getProjectMeta: jest.fn(),
      updateamplifyMetaAfterResourceUpdate: jest.fn(),
      updateBackendConfigAfterResourceAdd: jest.fn(),
      updateBackendConfigAfterResourceUpdate: jest.fn(),
      updateBackendConfigAfterResourceRemove: jest.fn(),
    },
    usageData: { emitError: jest.fn() },
  } as unknown as $TSContext;

  // construct mock amplify meta
  const mockAmplifyMeta: $TSObject = {
    geo: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAmplifyMeta.geo[mockMapName] = { ...mockMapParameters, ...mockMapResource };
    mockAmplifyMeta.geo[secondaryMapName] = { ...mockMapParameters, ...secondaryMapResource };
    mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;
    mockContext.amplify.getUserPoolGroupList = jest.fn().mockReturnValue([mockUserPoolGroup]);

    pathManager.getBackendDirPath = jest.fn().mockReturnValue('');
    JSONUtilities.readJson = jest.fn().mockReturnValue({});
    JSONUtilities.writeJson = jest.fn().mockReturnValue('');
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    printer.warn = jest.fn();
    printer.error = jest.fn();
    printer.success = jest.fn();
    printer.info = jest.fn();
    prompter.input = jest.fn().mockImplementation((message: string): Promise<any> => {
      let mockUserInput = 'mock';
      if (message === 'Provide a name for the Map:') {
        mockUserInput = mockMapParameters.name;
      }
      return new Promise<any>((resolve) => {
        resolve(mockUserInput);
      });
    });
    prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
      let mockUserInput: string | string[];
      if (message === 'Select one or more cognito groups to give access:') {
        mockUserInput = mockMapParameters.groupPermissions;
      }
      if (message === 'Restrict access by?') {
        mockUserInput = 'Both';
      }
      if (message === `Specify the map style. Refer ${apiDocs.mapStyles}`) {
        mockUserInput = getGeoMapStyle(mockMapParameters.dataProvider, mockMapParameters.mapStyleType);
      } else if (message === 'Who can access this Map?') {
        mockUserInput = mockMapParameters.accessType;
      } else if (message === 'Select the Map you want to update') {
        mockUserInput = mockMapParameters.name;
      } else if (message === 'Select the Map you want to set as default:') {
        mockUserInput = secondaryMapName;
      } else if (message === 'Select the Map you want to remove') {
        mockUserInput = mockMapName;
      }
      return new Promise<any>((resolve) => {
        resolve(mockUserInput);
      });
    });
    prompter.yesOrNo = jest.fn().mockReturnValue(mockMapParameters.isDefault);
  });

  it('sets parameters based on user input for update map walkthrough', async () => {
    // set initial map parameters before update
    mockAmplifyMeta.geo[mockMapName].accessType = AccessType.AuthorizedAndGuestUsers;
    mockAmplifyMeta.geo[mockMapName].isDefault = true;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    // update the map's default settings to false; should set the secondary map as default
    prompter.yesOrNo = jest.fn().mockReturnValue(false);

    let mapParams: Partial<MapParameters> = {
      providerContext: mockMapParameters.providerContext,
    };

    mapParams = await updateMapWalkthrough(mockContext, mapParams, mockMapName);

    // The default map is now changed to secondary map
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(category, mockMapName, 'isDefault', false);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(category, secondaryMapName, 'isDefault', true);
    expect(mockContext.amplify.updateBackendConfigAfterResourceUpdate).toBeCalledTimes(2);
    // The map parameters are updated
    expect(mockMapParameters).toMatchObject(mapParams);
  });

  it('early returns and prints error if no map resource to update', async () => {
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const mapParams: Partial<MapParameters> = {
      providerContext: mockMapParameters.providerContext,
    };

    await updateMapWalkthrough(mockContext, mapParams, mockMapName);

    expect(printer.error).toBeCalledWith('No Map resource to update. Use "amplify add geo" to create a new Map.');
  });

  it('sets parameters based on user input for adding subsequent map walkthrough', async () => {
    mockAmplifyMeta.geo = {};
    mockAmplifyMeta.geo[secondaryMapName] = { ...mockMapParameters, ...secondaryMapResource, isDefault: true };
    mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    let mapParams: Partial<MapParameters> = {
      providerContext: mockMapParameters.providerContext,
    };

    mapParams = await createMapWalkthrough(mockContext, mapParams);

    expect(mockMapParameters).toMatchObject(mapParams);
  });

  it('sets the first map added as default automatically', async () => {
    let mapParams: Partial<MapParameters> = {
      providerContext: mockMapParameters.providerContext,
    };
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    prompter.yesOrNo = jest.fn().mockReturnValue(false);

    mapParams = await createMapWalkthrough(mockContext, mapParams);

    expect({ ...mockMapParameters, isDefault: true }).toMatchObject(mapParams);
    // map default setting question is skipped
    expect(prompter.yesOrNo).toBeCalledTimes(1);
    expect(prompter.yesOrNo).toBeCalledWith('Do you want to configure advanced settings?', false);
  });

  it('sets the resource to remove correctly', async () => {
    expect(await removeWalkthrough(service)).toEqual(mockMapName);
  });

  it('early returns and prints error if no map resource to remove', async () => {
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    await removeWalkthrough(service);

    expect(printer.error).toBeCalledWith('No Map exists in the project.');
  });

  it('updates default map to another map if it is removed', async () => {
    mockContext.amplify.removeResource = jest.fn().mockReturnValue({
      service: ServiceName.Map,
      resourceName: mockMapName,
    });

    // given the map to be removed is default
    mockAmplifyMeta.geo[mockMapName].isDefault = true;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const { removeMapResource } = require('../../provider-controllers/map');

    expect(await removeMapResource(mockContext)).toEqual(mockMapName);
    // The default map is now changed to secondary map
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(category, mockMapName, 'isDefault', false);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(category, secondaryMapName, 'isDefault', true);
    expect(mockContext.amplify.updateBackendConfigAfterResourceUpdate).toBeCalledTimes(2);
  });
});
