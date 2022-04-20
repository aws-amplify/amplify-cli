import {
  $TSContext, $TSObject, stateManager, pathManager, JSONUtilities,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { DataSourceIntendedUse, PlaceIndexParameters } from '../../service-utils/placeIndexParams';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';
import { provider, ServiceName } from '../../service-utils/constants';
import { category } from '../../constants';

const { createPlaceIndexWalkthrough, updatePlaceIndexWalkthrough } = require('../../service-walkthroughs/placeIndexWalkthrough');
const { removeWalkthrough } = require('../../service-walkthroughs/removeWalkthrough');

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

describe('Search walkthrough works as expected', () => {
  const projectName = 'mockProject';
  const service = ServiceName.PlaceIndex;
  const mockPlaceIndexName = 'mockindex12345';
  const secondaryPlaceIndexName = 'secondaryindex12345';
  const mockUserPoolGroup = 'mockCognitoGroup';
  const mockMapResource = {
    resourceName: 'map12345',
    service: ServiceName.Map,
  };
  const mockPlaceIndexResource = {
    resourceName: mockPlaceIndexName,
    service,
  };
  const secondaryPlaceIndexResource = {
    resourceName: secondaryPlaceIndexName,
    service,
  };
  const mockPlaceIndexParameters: PlaceIndexParameters = {
    providerContext: {
      provider,
      service,
      projectName,
    },
    name: mockPlaceIndexName,
    dataProvider: DataProvider.Here,
    dataSourceIntendedUse: DataSourceIntendedUse.SingleUse,
    accessType: AccessType.AuthorizedUsers,
    isDefault: false,
    groupPermissions: [mockUserPoolGroup],
  };

  const mockContext = ({
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
  } as unknown) as $TSContext;

  // construct mock amplify meta
  const mockAmplifyMeta: $TSObject = {
    geo: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAmplifyMeta.geo[mockPlaceIndexName] = { ...mockPlaceIndexParameters, ...mockPlaceIndexResource };
    mockAmplifyMeta.geo[secondaryPlaceIndexName] = { ...mockPlaceIndexParameters, ...secondaryPlaceIndexResource };
    mockAmplifyMeta.geo[mockMapResource.resourceName] = mockMapResource;

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
      if (message === 'Provide a name for the location search index (place index):') {
        mockUserInput = mockPlaceIndexParameters.name;
      }
      return new Promise<any>(resolve => {
        resolve(mockUserInput);
      });
    });
    prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
      let mockUserInput: string | string[];
      if (message === 'Select one or more cognito groups to give access:') {
        mockUserInput = mockPlaceIndexParameters.groupPermissions;
      }
      if (message === 'Restrict access by?') {
        mockUserInput = 'Both';
      }
      if (message === 'Who can access this search index?') {
        mockUserInput = mockPlaceIndexParameters.accessType;
      } else if (message === 'Are you tracking or directing commercial assets for your business in your app?') {
        mockUserInput = 'Unknown';
      } else if (message === 'Select the search index you want to update') {
        mockUserInput = mockPlaceIndexParameters.name;
      } else if (message === 'Select the search index you want to set as default:') {
        mockUserInput = secondaryPlaceIndexName;
      } else if (message === 'Select the search index you want to remove') {
        mockUserInput = mockPlaceIndexName;
      } else if (message === 'Specify the data provider of geospatial data for this search index:') {
        mockUserInput = mockPlaceIndexParameters.dataProvider;
      }
      return new Promise<any>(resolve => {
        resolve(mockUserInput);
      });
    });
    prompter.yesOrNo = jest.fn().mockReturnValue(mockPlaceIndexParameters.isDefault);
  });

  it('sets parameters based on user input for update place index walkthrough', async () => {
    // set initial place index parameters before update
    mockAmplifyMeta.geo[mockPlaceIndexName].accessType = AccessType.AuthorizedAndGuestUsers;
    mockAmplifyMeta.geo[mockPlaceIndexName].isDefault = true;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    // update the index's default settings to false; should set the secondary index as default
    prompter.yesOrNo = jest.fn().mockReturnValue(false);

    let indexParams: Partial<PlaceIndexParameters> = {
      providerContext: mockPlaceIndexParameters.providerContext,
    };

    indexParams = await updatePlaceIndexWalkthrough(mockContext, indexParams, mockPlaceIndexName);

    // The default place index is now changed to secondary map
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, mockPlaceIndexName, 'isDefault', false);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, secondaryPlaceIndexName, 'isDefault', true);

    expect(mockContext.amplify.updateBackendConfigAfterResourceUpdate).toBeCalledTimes(2);
    // The place index parameters are updated
    expect(mockPlaceIndexParameters).toMatchObject(indexParams);
  });

  it('early returns and prints error if no place index resource to update', async () => {
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const indexParams: Partial<PlaceIndexParameters> = {
      providerContext: mockPlaceIndexParameters.providerContext,
    };

    await updatePlaceIndexWalkthrough(mockContext, indexParams, mockPlaceIndexName);

    expect(printer.error).toBeCalledWith('No search index resource to update. Use "amplify add geo" to create a new search index.');
  });

  it('sets parameters based on user input for adding subsequent place index walkthrough', async () => {
    mockAmplifyMeta.geo = {};
    mockAmplifyMeta.geo[secondaryPlaceIndexName] = { ...mockPlaceIndexParameters, ...secondaryPlaceIndexResource, isDefault: true };
    mockAmplifyMeta.geo[mockMapResource.resourceName] = mockMapResource;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    let indexParams: Partial<PlaceIndexParameters> = {
      providerContext: mockPlaceIndexParameters.providerContext,
    };

    indexParams = await createPlaceIndexWalkthrough(mockContext, indexParams);

    expect(mockPlaceIndexParameters).toMatchObject(indexParams);
  });

  it('sets the first place index added as default automatically', async () => {
    let indexParams: Partial<PlaceIndexParameters> = {
      providerContext: mockPlaceIndexParameters.providerContext,
    };
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    indexParams = await createPlaceIndexWalkthrough(mockContext, indexParams);

    expect({ ...mockPlaceIndexParameters, isDefault: true }).toMatchObject(indexParams);
    // place index default setting question is skipped
    expect(prompter.yesOrNo).toBeCalledTimes(1);
    expect(prompter.yesOrNo).toBeCalledWith('Do you want to configure advanced settings?', false);
  });

  it('sets the resource to remove correctly', async () => {
    expect(await (removeWalkthrough(mockContext, service))).toEqual(mockPlaceIndexName);
  });

  it('early returns and prints error if no place index resource to remove', async () => {
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    await removeWalkthrough(mockContext, service);

    expect(printer.error).toBeCalledWith('No search index exists in the project.');
  });

  it('updates default place index to another place index if it is removed', async () => {
    mockContext.amplify.removeResource = jest.fn().mockReturnValue({
      service: ServiceName.PlaceIndex,
      resourceName: mockPlaceIndexName,
    });

    // given the place index to be removed is default
    mockAmplifyMeta.geo[mockPlaceIndexName].isDefault = true;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const { removePlaceIndexResource } = require('../../provider-controllers/placeIndex');

    expect(await (removePlaceIndexResource(mockContext))).toEqual(mockPlaceIndexName);
    // The default place index is now changed to secondary place index
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, mockPlaceIndexName, 'isDefault', false);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, secondaryPlaceIndexName, 'isDefault', true);
    expect(mockContext.amplify.updateBackendConfigAfterResourceUpdate).toBeCalledTimes(2);
  });
});
