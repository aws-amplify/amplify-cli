import { $TSContext, $TSObject, stateManager, pathManager, JSONUtilities, $TSAny } from 'amplify-cli-core';
import { GeofenceCollectionParameters } from '../../service-utils/geofenceCollectionParams';
import { AccessType, DataProvider, PricingPlan } from '../../service-utils/resourceParams';
import { provider, ServiceName } from '../../service-utils/constants';
import { category } from '../../constants';
import { printer, prompter } from 'amplify-prompts';

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
        service: ServiceName.PlaceIndex,
        pricingPlan: PricingPlan.MobileAssetTracking
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
        pricingPlan: PricingPlan.MobileAssetTracking,
        accessType: AccessType.CognitoGroups,
        isDefault: false,
        groupPermissions: mockGroupPermissions
    };

    const mockContext = ({
        amplify: {
            serviceSelectionPrompt: async () => {
                return { service: service, providerName: provider};
            },
            getResourceStatus: jest.fn(),
            inputValidation: jest.fn(),
            getProjectMeta: jest.fn(),
            updateamplifyMetaAfterResourceUpdate: jest.fn()
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

        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockGeofenceCollectionResource, secondaryGeofenceCollectionResource, mockPlaceIndexResource]
                });
            });
        });
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
            if (message === 'Provide a name for the Geofence Collection:') {
                mockUserInput = mockGeofenceCollectionParameters.name
            }
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
        });
        prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
            let mockUserInput: any = 'mock';
            if (message === 'Select one or more cognito groups to give access:') {
                mockUserInput = mockUserPoolGroup;
            }
            else if (message === `What kind of access do you want for ${mockUserPoolGroup} users? Select ALL that apply:`) {
                mockUserInput = mockGeofenceCollectionParameters.groupPermissions[mockUserPoolGroup];
            }
            else if (message === 'Are you tracking or directing commercial assets for your business in your app?') {
                mockUserInput = 'Unknown';
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
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
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
            else if (message === 'Does your app need Maps, Location Search or Routing?') {
                mockUserInput = true;
            }
            else if (message === 'Does your app provide routing or route optimization for commercial assets?') {
                mockUserInput = false;
            }
            return new Promise<boolean>((resolve) => {
                resolve(mockUserInput);
            });
        });

        let collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext
        };

        const updateGeofenceCollectionWalkthrough = require('../../service-walkthroughs/geofenceCollectionWalkthrough').updateGeofenceCollectionWalkthrough;
        collectionParams = await updateGeofenceCollectionWalkthrough(mockContext, collectionParams, mockGeofenceCollectionName);

        // The default geofence collection is now changed to secondary geofence collection
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockGeofenceCollectionName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryGeofenceCollectionName, "isDefault", true);
        
        // The geofence collection parameters are updated
        expect(mockGeofenceCollectionParameters).toMatchObject(collectionParams);
    });

    it('early returns and prints error if no geofence collection resource to update', async() => {
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: []
                });
            });
        });

        const collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext
        };

        const updateGeofenceCollectionWalkthrough = require('../../service-walkthroughs/geofenceCollectionWalkthrough').updateGeofenceCollectionWalkthrough;
        await updateGeofenceCollectionWalkthrough(mockContext, collectionParams, mockGeofenceCollectionName);

        expect(printer.error).toBeCalledWith('No geofence collection resource to update. Use "amplify add geo" to create a new geofence collection.');
    });

    it('sets parameters based on user input for adding subsequent geofence collection walkthrough', async() => {
        mockAmplifyMeta.geo = {};
        mockAmplifyMeta.geo[secondaryGeofenceCollectionName] = { ...mockGeofenceCollectionParameters, ...secondaryGeofenceCollectionResource, isDefault: true };
        mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        let collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext
        };

        const createGeofenceCollectionWalkthrough = require('../../service-walkthroughs/geofenceCollectionWalkthrough').createGeofenceCollectionWalkthrough;
        collectionParams = await createGeofenceCollectionWalkthrough(mockContext, collectionParams);

        expect(mockGeofenceCollectionParameters).toMatchObject(collectionParams);
    });

    it('sets the first map added as default automatically', async() => {
        prompter.yesOrNo = jest.fn().mockImplementation((message: string): Promise<boolean> => {
            let mockUserInput: boolean = false;
            if (message === 'Do you want to update advanced settings?') {
                mockUserInput = true;
            }
            else if (message === 'Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.') {
                mockUserInput = false;
            }
            else if (message === 'Does your app need Maps, Location Search or Routing?') {
                mockUserInput = true;
            }
            else if (message === 'Does your app provide routing or route optimization for commercial assets?') {
                mockUserInput = false;
            }
            return new Promise<boolean>((resolve) => {
                resolve(mockUserInput);
            });
        });
        let collectionParams: Partial<GeofenceCollectionParameters> = {
            providerContext: mockGeofenceCollectionParameters.providerContext
        };
        mockAmplifyMeta.geo = {};
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const createGeofenceCollectionWalkthrough = require('../../service-walkthroughs/geofenceCollectionWalkthrough').createGeofenceCollectionWalkthrough;
        collectionParams = await createGeofenceCollectionWalkthrough(mockContext, collectionParams);

        expect({ ...mockGeofenceCollectionParameters, isDefault: true }).toMatchObject(collectionParams);
        // geofence collection default setting question is skipped
        expect(prompter.yesOrNo).not.toBeCalledWith('Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.', true);
    });

    it('sets the resource to remove correctly', async() => {
        const removeWalkthrough = require('../../service-walkthroughs/removeWalkthrough').removeWalkthrough;
        expect(await(removeWalkthrough(mockContext, service))).toEqual(mockGeofenceCollectionName);
    });

    it('early returns and prints error if no geofence collection resource to remove', async() => {
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: []
                });
            });
        });

        const removeWalkthrough = require('../../service-walkthroughs/removeWalkthrough').removeWalkthrough;
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
        
        expect(await(removeGeofenceCollectionResource(mockContext))).toEqual(mockGeofenceCollectionName);
        // The default geofence collection is now changed to secondary collection
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockGeofenceCollectionName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryGeofenceCollectionName, "isDefault", true);
    });
});
