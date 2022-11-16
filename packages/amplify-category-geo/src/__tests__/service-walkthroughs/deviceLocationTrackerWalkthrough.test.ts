import {
  $TSContext, $TSObject, stateManager, pathManager, JSONUtilities,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';
import { provider, ServiceName } from '../../service-utils/constants';
import { category } from '../../constants';
import { DeviceLocationTrackingParameters } from '../../service-utils/deviceLocationTrackingParams';
import { deviceLocationTrackerAdvancedWalkthrough } from '../../service-walkthroughs/deviceLocationTrackingWalkthrough';
import { deviceLocationTrackingAdvancedSettings } from '../../service-utils/deviceLocationTrackingConstants';
import { updateDeviceLocationTrackerWalkthrough } from '../../service-walkthroughs/deviceLocationTrackingWalkthrough';

const { updateGeofenceCollectionWalkthrough } = require('../../service-walkthroughs/geofenceCollectionWalkthrough');
const { removeWalkthrough } = require('../../service-walkthroughs/removeWalkthrough');

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

describe('Device Location Tracker walkthrough works as expected', () => {
  const projectName = 'mockProject';
  const service = ServiceName.DeviceLocationTracking;
  const mockDeviceTrackerName = 'mockDeviceTracker12345';
  const secondaryDeviceTrackerName = 'secondaryDeviceTracker12345';
  const mockUserPoolGroup = 'mockCognitoGroup';
  const mockDeviceTrackerResource = {
    resourceName: mockDeviceTrackerName,
    service,
  };
  const secondaryDeviceTrackerResource = {
    resourceName: secondaryDeviceTrackerName,
    service,
    isDefault: false,
  };
  const mockPlaceIndexResource = {
    resourceName: 'placeIndex12345',
    service: ServiceName.PlaceIndex,
  };

  const mockGroupPermissions: string[] = [mockUserPoolGroup];
  const mockRoleAndGroupPermissionsMap: Record<string, string[]> = {};
  mockRoleAndGroupPermissionsMap[mockUserPoolGroup] = [
    'List device positions',
  ];

  const mockDeviceTrackerParameters: DeviceLocationTrackingParameters = {
    providerContext: {
      provider,
      service,
      projectName,
    },
    name: mockDeviceTrackerName,
    dataProvider: DataProvider.Esri,
    accessType: AccessType.AuthorizedAndGuestUsers,
    isDefault: false,
    groupPermissions: mockGroupPermissions,
    roleAndGroupPermissionsMap: mockRoleAndGroupPermissionsMap,
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

    mockAmplifyMeta.geo[mockDeviceTrackerName] = { ...mockDeviceTrackerParameters, ...mockDeviceTrackerResource };
    mockAmplifyMeta.geo[secondaryDeviceTrackerName] = { ...mockDeviceTrackerParameters, ...secondaryDeviceTrackerResource };
    mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;

    mockContext.amplify.getUserPoolGroupList = jest.fn().mockReturnValue([mockUserPoolGroup]);

    pathManager.getBackendDirPath = jest.fn().mockReturnValue('');
    // mock reading the role group permissions
    const mockTrackerRoleAndGroupPermissionsMap: Record<string, $TSObject> = {};
    // eslint-disable-next-line max-len
    mockTrackerRoleAndGroupPermissionsMap[mockDeviceTrackerName] = { roleAndGroupPermissionsMap: mockDeviceTrackerParameters.roleAndGroupPermissionsMap };
    stateManager.getResourceInputsJson = jest.fn().mockReturnValue(mockTrackerRoleAndGroupPermissionsMap);
    JSONUtilities.writeJson = jest.fn().mockReturnValue('');

    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    printer.warn = jest.fn();
    printer.error = jest.fn();
    printer.success = jest.fn();
    printer.info = jest.fn();
    prompter.input = jest.fn().mockImplementation((message: string): Promise<any> => {
      let mockUserInput = 'mock';
      if (message === 'Provide a name for the device location tracker:') {
        mockUserInput = mockDeviceTrackerParameters.name;
      }
      return Promise.resolve(mockUserInput);
    });
    prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
      let mockUserInput: string | string[] = 'mock';
      if (message === 'Restrict access by?') {
        mockUserInput = 'Both';
      } else if (message === 'Who can access this device tracker?') {
        mockUserInput = AccessType.AuthorizedAndGuestUsers;
      } else if (message === 'Select one or more cognito groups to give access:') {
        mockUserInput = mockDeviceTrackerParameters.groupPermissions;
      } else if (message === `What kind of access do you want for ${mockUserPoolGroup} users? Select ALL that apply:`) {
        mockUserInput = mockDeviceTrackerParameters.roleAndGroupPermissionsMap[mockUserPoolGroup];
      } else if (message === 'Select the device tracker you want to update') {
        mockUserInput = mockDeviceTrackerParameters.name;
      } else if (message === 'Select the device tracker you want to set as default:') {
        mockUserInput = secondaryDeviceTrackerName;
      } else if (message === 'Select the device tracker you want to remove') {
        mockUserInput = mockDeviceTrackerName;
      } else if (message === 'Specify the data provider for device tracker. This will be only used to calculate billing.') {
        mockUserInput = mockDeviceTrackerParameters.dataProvider;
      }
      return Promise.resolve(mockUserInput);
    });
    prompter.yesOrNo = jest.fn().mockResolvedValue(mockDeviceTrackerParameters.isDefault);
  });

  it('sets parameters based on user input for update device tracker walkthrough', async () => {
    // set initial device tracker parameters before update
    mockAmplifyMeta.geo[mockDeviceTrackerName].isDefault = true;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    // update the collection's default settings to false; should set the secondary collection as default
    prompter.yesOrNo = jest.fn().mockImplementation((message: string): Promise<boolean> => {
      let mockUserInput = false;
      if (message === 'Do you want to update advanced settings?') {
        mockUserInput = false;
      } else if (message === 'Set this device tracker as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.') {
        mockUserInput = false;
      }
      return Promise.resolve(mockUserInput);
    });

    let trackerParams: Partial<DeviceLocationTrackingParameters> = {
      providerContext: mockDeviceTrackerParameters.providerContext,
      dataProvider: mockDeviceTrackerParameters.dataProvider,
    };

    trackerParams = await updateDeviceLocationTrackerWalkthrough(mockContext, trackerParams, mockDeviceTrackerName);

    // The default geofence collection is now changed to secondary geofence collection
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, mockDeviceTrackerName, 'isDefault', false);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, secondaryDeviceTrackerName, 'isDefault', true);

    // The geofence collection parameters are updated
    expect(trackerParams).toMatchObject(mockDeviceTrackerParameters);
  });

  it('early returns and prints error if no geofence collection resource to update', async () => {
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const trackerParams: Partial<DeviceLocationTrackingParameters> = {
      providerContext: mockDeviceTrackerParameters.providerContext,
      dataProvider: mockDeviceTrackerParameters.dataProvider,
    };

    await updateDeviceLocationTrackerWalkthrough(mockContext, trackerParams, mockDeviceTrackerName);

    expect(printer.error).toBeCalledWith('No device tracker resource to update. Use "amplify add geo" to create a new device tracker.');
  });

  it('sets the resource to remove correctly', async () => {
    expect(await removeWalkthrough(service)).toEqual(mockDeviceTrackerName);
  });

  it('early returns and prints error if no device tracker resource to remove', async () => {
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    await removeWalkthrough(service);

    expect(printer.error).toBeCalledWith(`No device tracker exists in the project.`);
  });

  it('updates default device tracker to another if it is removed', async () => {
    mockContext.amplify.removeResource = jest.fn().mockReturnValue({
      service: ServiceName.DeviceLocationTracking,
      resourceName: mockDeviceTrackerName,
    });

    // given the geofence collection to be removed is default
    mockAmplifyMeta.geo[mockDeviceTrackerName].isDefault = true;
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const { removeDeviceLocationTrackingResource } = await import('../../provider-controllers/deviceLocationTracking');

    expect(await removeDeviceLocationTrackingResource(mockContext)).toEqual(mockDeviceTrackerName);
    // The default geofence collection is now changed to secondary collection
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, mockDeviceTrackerName, 'isDefault', false);
    expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
      .toBeCalledWith(category, secondaryDeviceTrackerName, 'isDefault', true);
  });

  it('sets position filtering parameter based on user input for advanced device tracker walkthrough', async () => {
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    prompter.yesOrNo = jest.fn().mockImplementation((message: string): Promise<boolean> => {
      let mockUserInput = false;
      if (message === 'Do you want to configure advanced settings?') {
        mockUserInput = true;
      } else if (message === 'Set this device tracker as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.') {
        mockUserInput = false;
      } else if (message === 'Do you want to set the position filtering method for this tracker?') {
        mockUserInput = true;
      }
      return Promise.resolve(mockUserInput);
    });
    prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
      let mockUserInput: string | string[] = 'mock';
      if (message === 'Here are the default advanced settings. Select a setting to edit or continue (Use arrow keys)') {
        mockUserInput = deviceLocationTrackingAdvancedSettings.setPositionFilteringMethod;
      } else if (message === 'Specify the position filtering method for this device tracker') {
        mockUserInput = 'Accuracy-based';
      }
      return Promise.resolve(mockUserInput);
    });

    let trackerParams: Partial<DeviceLocationTrackingParameters> = mockDeviceTrackerParameters;

    trackerParams = await deviceLocationTrackerAdvancedWalkthrough(mockContext, trackerParams);
    expect(trackerParams).toMatchObject({ ...mockDeviceTrackerParameters, positionFiltering: 'AccuracyBased' });
  });

  it('sets linked geofence collections parameter based on user input for advanced device tracker walkthrough', async () => {
    const mockAmplifyMetaWithGeofenceCollection: $TSObject = {
      geo: {
        geofenceCollection1: {
          service: 'GeofenceCollection',
        },
        geofenceCollection2: {
          service: 'GeofenceCollection',
        },
      },
    };
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMetaWithGeofenceCollection);
    prompter.yesOrNo = jest.fn().mockImplementation((message: string): Promise<boolean> => {
      let mockUserInput = false;
      if (message === 'Do you want to configure advanced settings?') {
        mockUserInput = true;
      } else if (message === 'Set this device tracker as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.') {
        mockUserInput = false;
      } else if (message === 'Do you want to link geofence collection(s) to this tracker?') {
        mockUserInput = true;
      }
      return Promise.resolve(mockUserInput);
    });
    prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
      let mockUserInput: string | string[] = 'mock';
      if (message === 'Here are the default advanced settings. Select a setting to edit or continue (Use arrow keys)') {
        mockUserInput = deviceLocationTrackingAdvancedSettings.linkGeofenceCollection;
      } else if (message === 'Select the geofence collection(s) you want to link to this tracker') {
        mockUserInput = [
          'geofenceCollection1',
          'geofenceCollection2',
        ];
      }
      return Promise.resolve(mockUserInput);
    });

    let trackerParams: Partial<DeviceLocationTrackingParameters> = mockDeviceTrackerParameters;

    trackerParams = await deviceLocationTrackerAdvancedWalkthrough(mockContext, trackerParams);
    expect(trackerParams).toMatchObject({ ...mockDeviceTrackerParameters, linkedGeofenceCollections: ['geofenceCollection1', 'geofenceCollection2'] });
  });
});
