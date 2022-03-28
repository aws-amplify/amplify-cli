import { $TSContext, $TSObject, stateManager, pathManager, JSONUtilities } from 'amplify-cli-core';
import { GeofenceCollectionParameters } from '../../service-utils/geofenceCollectionParams';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';
import { provider, ServiceName } from '../../service-utils/constants';
import { category } from '../../constants';
import { printer, prompter } from 'amplify-prompts';
const { updateGeofenceCollectionWalkthrough } = require('../../service-walkthroughs/geofenceCollectionWalkthrough');
const { removeWalkthrough } = require('../../service-walkthroughs/removeWalkthrough');

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

describe('Geofence Collection walkthrough works as expected', () => {
    const projectName = 'mockProject';
    const service = ServiceName.GeofenceCollection;
    const mockGeofenceCollectionName = 'mockCollection12345';
    const secondaryGeofenceCollectionName = 'secondaryCollection12345';
    const mockUserPoolGroup: string = 'mockCognitoGroup';
    const mockGeofenceCollectionResource = {
        resourceName: mockGeofenceCollectionName,
        service: service
    };
    const secondaryGeofenceCollectionResource = {
        resourceName: secondaryGeofenceCollectionName,
        service: service,
        isDefault: false
    };
    const mockPlaceIndexResource = {
        resourceName: 'placeIndex12345',
        service: ServiceName.PlaceIndex
    };

    const mockGroupPermissions: Record<string, string[]> = {};
    mockGroupPermissions[mockUserPoolGroup] = [
        "Read geofence",
        "Create/Update geofence"
    ];

    const mockGeofenceCollectionParameters: GeofenceCollectionParameters = {
        providerContext: {
            provider: provider,
            service: service,
            projectName: projectName
        },
        name: mockGeofenceCollectionName,
        dataProvider: DataProvider.Esri,
        accessType: AccessType.CognitoGroups,
        isDefault: false,
        groupPermissions: mockGroupPermissions
    };

    const mockContext = ({
        amplify: {
            serviceSelectionPrompt: async () => {
                return { service: service, providerName: provider};
            },
            inputValidation: jest.fn(),
            getProjectMeta: jest.fn(),
            updateamplifyMetaAfterResourceUpdate: jest.fn(),
            updateBackendConfigAfterResourceAdd: jest.fn(),
            updateBackendConfigAfterResourceUpdate: jest.fn(),
            updateBackendConfigAfterResourceRemove: jest.fn()
        },
        usageData: { emitError: jest.fn() }
    } as unknown) as $TSContext;

    // construct mock amplify meta
    const mockAmplifyMeta: $TSObject = {
        geo: {}
    };
    
    beforeEach(() => {
        jest.clearAllMocks();

        mockAmplifyMeta.geo[mockGeofenceCollectionName] = { ...mockGeofenceCollectionParameters, ...mockGeofenceCollectionResource };
        mockAmplifyMeta.geo[secondaryGeofenceCollectionName] = { ...mockGeofenceCollectionParameters, ...secondaryGeofenceCollectionResource };
        mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;

        mockContext.amplify.getUserPoolGroupList = jest.fn().mockReturnValue([mockUserPoolGroup]);

        pathManager.getBackendDirPath = jest.fn().mockReturnValue('');
        // mock reading the group permissions
        const mockCollectionGroupPermissions: Record<string, $TSObject> = {};
        mockCollectionGroupPermissions[mockGeofenceCollectionName] = { groupPermissions: mockGeofenceCollectionParameters.groupPermissions };
        JSONUtilities.readJson = jest.fn().mockReturnValue(mockCollectionGroupPermissions);
        JSONUtilities.writeJson = jest.fn().mockReturnValue('');

        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        printer.warn = jest.fn();
        printer.error = jest.fn();
        printer.success = jest.fn();
        printer.info = jest.fn();
        prompter.input = jest.fn().mockImplementation((message: string): Promise<any> => {
            let mockUserInput = 'mock';
            if (message === 'Provide a name for the Geofence Collection:') {
                mockUserInput = mockGeofenceCollectionParameters.name
            }
            return Promise.resolve(mockUserInput);
        });
        prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
            let mockUserInput: string | string[] = 'mock';
            if (message === 'Select one or more cognito groups to give access:') {
                mockUserInput = Object.keys(mockGeofenceCollectionParameters.groupPermissions);
            }
            else if (message === `What kind of access do you want for ${mockUserPoolGroup} users? Select ALL that apply:`) {
                mockUserInput = mockGeofenceCollectionParameters.groupPermissions[mockUserPoolGroup];
            }
            else if (message === 'Select the geofence collection you want to update') {
                mockUserInput = mockGeofenceCollectionParameters.name;
            }
            else if (message === 'Select the geofence collection you want to set as default:') {
                mockUserInput = secondaryGeofenceCollectionName;
            }
            else if (message === 'Select the geofence collection you want to remove') {
                mockUserInput = mockGeofenceCollectionName;
            }
            else if (message === 'Specify the data provider for geofence collection. This will be only used to calculate billing.') {
                mockUserInput = mockGeofenceCollectionParameters.dataProvider;
            }
            return Promise.resolve(mockUserInput);
        });
        prompter.yesOrNo = jest.fn().mockReturnValue(mockGeofenceCollectionParameters.isDefault);
    });

    it('sets parameters based on user input for update geofence collection walkthrough', async() => {
        // set initial geofence collection parameters before update
        mockAmplifyMeta.geo[mockGeofenceCollectionName].isDefault = true;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        // update the collection's default settings to false; should set the secondary collection as default
        prompter.yesOrNo = jest.fn().mockImplementation((message: string): Promise<boolean> => {
            let mockUserInput: boolean = false;
            if (message === 'Do you want to update advanced settings?') {
                mockUserInput = true;
            }
            else if (message === 'Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.') {
                mockUserInput = false;
            }
            return Promise.resolve(mockUserInput);
        });

        let collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext,
            dataProvider: mockGeofenceCollectionParameters.dataProvider
        };

        collectionParams = await updateGeofenceCollectionWalkthrough(mockContext, collectionParams, mockGeofenceCollectionName);

        // The default geofence collection is now changed to secondary geofence collection
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockGeofenceCollectionName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryGeofenceCollectionName, "isDefault", true);
        
        // The geofence collection parameters are updated
        expect(collectionParams).toMatchObject(mockGeofenceCollectionParameters);
    });

    it('early returns and prints error if no geofence collection resource to update', async() => {
        mockAmplifyMeta.geo = {};
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext,
            dataProvider: mockGeofenceCollectionParameters.dataProvider
        };

        await updateGeofenceCollectionWalkthrough(mockContext, collectionParams, mockGeofenceCollectionName);

        expect(printer.error).toBeCalledWith('No geofence collection resource to update. Use "amplify add geo" to create a new geofence collection.');
    });

    it('sets parameters based on user input for adding subsequent geofence collection walkthrough', async() => {
        mockAmplifyMeta.geo = {};
        mockAmplifyMeta.geo[secondaryGeofenceCollectionName] = { ...mockGeofenceCollectionParameters, ...secondaryGeofenceCollectionResource, isDefault: true };
        mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        let collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext,
            dataProvider: mockGeofenceCollectionParameters.dataProvider
        };

        const createGeofenceCollectionWalkthrough = require('../../service-walkthroughs/geofenceCollectionWalkthrough').createGeofenceCollectionWalkthrough;
        collectionParams = await createGeofenceCollectionWalkthrough(mockContext, collectionParams);

        expect(collectionParams).toMatchObject(mockGeofenceCollectionParameters);
    });

    it('sets the first geofence collection added as default automatically', async() => {
        prompter.yesOrNo = jest.fn().mockImplementation((message: string): Promise<boolean> => {
            let mockUserInput: boolean = false;
            if (message === 'Do you want to update advanced settings?') {
                mockUserInput = true;
            }
            else if (message === 'Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.') {
                mockUserInput = false;
            }
            return Promise.resolve(mockUserInput);
        });
        let collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext,
            dataProvider: mockGeofenceCollectionParameters.dataProvider
        };
        mockAmplifyMeta.geo = {};
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const createGeofenceCollectionWalkthrough = require('../../service-walkthroughs/geofenceCollectionWalkthrough').createGeofenceCollectionWalkthrough;
        collectionParams = await createGeofenceCollectionWalkthrough(mockContext, collectionParams);

        expect(collectionParams).toMatchObject({ ...mockGeofenceCollectionParameters, isDefault: true });
        // geofence collection default setting question is skipped
        expect(prompter.yesOrNo).not.toBeCalledWith('Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.', true);
    });

    it('sets the resource to remove correctly', async() => {
        expect(await removeWalkthrough(mockContext, service)).toEqual(mockGeofenceCollectionName);
    });

    it('early returns and prints error if no geofence collection resource to remove', async() => {
        mockAmplifyMeta.geo = {};
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        await removeWalkthrough(mockContext, service);

        expect(printer.error).toBeCalledWith(`No geofence collection exists in the project.`);
    });

    it('updates default geofence collection to another if it is removed', async() => {
        mockContext.amplify.removeResource = jest.fn().mockReturnValue({
            service: ServiceName.GeofenceCollection,
            resourceName: mockGeofenceCollectionName
        });

        // given the geofence collection to be removed is default
        mockAmplifyMeta.geo[mockGeofenceCollectionName].isDefault = true;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const removeGeofenceCollectionResource = require('../../provider-controllers/geofenceCollection').removeGeofenceCollectionResource;
        
        expect(await removeGeofenceCollectionResource(mockContext)).toEqual(mockGeofenceCollectionName);
        // The default geofence collection is now changed to secondary collection
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockGeofenceCollectionName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryGeofenceCollectionName, "isDefault", true);
    });
});
