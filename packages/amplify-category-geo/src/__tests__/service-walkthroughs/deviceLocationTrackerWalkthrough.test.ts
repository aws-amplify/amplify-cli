import {
  $TSContext, $TSObject, stateManager, pathManager, JSONUtilities,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { GeofenceCollectionParameters } from '../../service-utils/geofenceCollectionParams';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';
import { provider, ServiceName } from '../../service-utils/constants';
import { category } from '../../constants';
import { DeviceLocationTrackingParameters } from '../../service-utils/deviceLocationTrackingParams';

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
      } else if (message === 'Select the device location tracker you want to update') {
        mockUserInput = mockDeviceTrackerParameters.name;
      } else if (message === 'Select the device location tracker you want to set as default:') {
        mockUserInput = secondaryDeviceTrackerName;
      } else if (message === 'Select the device location tracker you want to remove') {
        mockUserInput = mockDeviceTrackerName;
      } else if (message === 'Specify the data provider for device location tracker. This will be only used to calculate billing.') {
        mockUserInput = mockDeviceTrackerParameters.dataProvider;
      }
      return Promise.resolve(mockUserInput);
    });
    prompter.yesOrNo = jest.fn().mockResolvedValue(mockDeviceTrackerParameters.isDefault);
  });

  it('sets the first device tracker added as default automatically', async () => {
    prompter.yesOrNo = jest.fn().mockImplementation((message: string): Promise<boolean> => {
      let mockUserInput = false;
      if (message === 'Do you want to update advanced settings?') {
        mockUserInput = true;
      } else if (message === 'Set this device tracker as the default? It will be used in Amplify device tracker API calls if no explicit reference is provided.') {
        mockUserInput = false;
      }
      return Promise.resolve(mockUserInput);
    });
    let trackerParams: Partial<DeviceLocationTrackingParameters> = {
      providerContext: mockDeviceTrackerParameters.providerContext,
      dataProvider: mockDeviceTrackerParameters.dataProvider,
    };
    mockAmplifyMeta.geo = {};
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

    const { createDeviceLocationTrackingWalkthrough } = await import('../../service-walkthroughs/deviceLocationTrackingWalkthrough');
    trackerParams = await createDeviceLocationTrackingWalkthrough(mockContext, trackerParams);

    expect(trackerParams).toMatchObject({ ...mockDeviceTrackerParameters, isDefault: true });
    expect(prompter.yesOrNo).not.toBeCalledWith('Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.', true);
  });
});
