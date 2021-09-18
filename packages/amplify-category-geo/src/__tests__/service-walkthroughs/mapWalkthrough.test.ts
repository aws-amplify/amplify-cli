import { $TSContext, $TSObject, stateManager, pathManager, JSONUtilities } from 'amplify-cli-core';
import { EsriMapStyleType, getGeoMapStyle, MapParameters, MapStyle } from '../../service-utils/mapParams';
import { AccessType, DataProvider, PricingPlan } from '../../service-utils/resourceParams';
import { provider, ServiceName, apiDocs } from '../../service-utils/constants';
import { category } from '../../constants';
import { printer, prompter } from 'amplify-prompts';

jest.mock('amplify-cli-core');
jest.mock('amplify-prompts');

describe('Map walkthrough works as expected', () => {
    const projectName = 'mockProject';
    const service = ServiceName.Map;
    const mockMapName = 'mockmap12345';
    const secondaryMapName = 'secondarymap12345';
    const mockMapResource = {
        resourceName: mockMapName,
        service: service,
        mapStyle: MapStyle.VectorEsriStreets
    };
    const secondaryMapResource = {
        resourceName: secondaryMapName,
        service: service,
        isDefault: false,
        mapStyle: MapStyle.VectorEsriStreets
    };
    const mockPlaceIndexResource = {
        resourceName: 'placeIndex12345',
        service: ServiceName.PlaceIndex,
        pricingPlan: PricingPlan.MobileAssetTracking
    };

    const mockMapParameters: MapParameters = {
        providerContext: {
            provider: provider,
            service: service,
            projectName: projectName
        },
        name: mockMapName,
        mapStyleType: EsriMapStyleType.Streets,
        dataProvider: DataProvider.Esri,
        pricingPlan: PricingPlan.MobileAssetTracking,
        accessType: AccessType.AuthorizedUsers,
        isDefault: false
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

        mockAmplifyMeta.geo[mockMapName] = { ...mockMapParameters, ...mockMapResource };
        mockAmplifyMeta.geo[secondaryMapName] = { ...mockMapParameters, ...secondaryMapResource };
        mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;

        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockMapResource, secondaryMapResource, mockPlaceIndexResource]
                });
            });
        });
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
                mockUserInput = mockMapParameters.name
            }
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
        });
        prompter.pick = jest.fn().mockImplementation((message: string): Promise<any> => {
            let mockUserInput = 'mock';
            if (message === `Specify the map style. Refer ${apiDocs.mapStyles}`) {
                mockUserInput = getGeoMapStyle(mockMapParameters.dataProvider, mockMapParameters.mapStyleType);
            }
            else if (message === 'Who can access this Map?') {
                mockUserInput = mockMapParameters.accessType;
            }
            else if (message === 'Are you tracking commercial assets for your business in your app?') {
                mockUserInput = 'Unknown';
            }
            else if (message === 'Select the Map you want to update') {
                mockUserInput = mockMapParameters.name;
            }
            else if (message === 'Select the Map you want to set as default:') {
                mockUserInput = secondaryMapName;
            }
            else if (message === 'Select the Map you want to remove') {
                mockUserInput = mockMapName;
            }
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
        });
        prompter.yesOrNo = jest.fn().mockReturnValue(mockMapParameters.isDefault);
    });

    it('sets parameters based on user input for update map walkthrough', async() => {
        // set initial map parameters before update
        mockAmplifyMeta.geo[mockMapName].accessType = AccessType.AuthorizedAndGuestUsers;
        mockAmplifyMeta.geo[mockMapName].isDefault = true;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        // update the map's default settings to false; should set the secondary map as default
        prompter.yesOrNo = jest.fn().mockReturnValue(false);

        let mapParams: Partial<MapParameters> = {
            providerContext: mockMapParameters.providerContext
        };

        const updateMapWalkthrough = require('../../service-walkthroughs/mapWalkthrough').updateMapWalkthrough;

        mapParams = await updateMapWalkthrough(mockContext, mapParams, mockMapName);

        // The default map is now changed to secondary map
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockMapName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryMapName, "isDefault", true);
        
        // The map parameters are updated
        expect(mockMapParameters).toMatchObject(mapParams);
    });

    it('early returns and prints error if no map resource to update', async() => {
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: []
                });
            });
        });

        let mapParams: Partial<MapParameters> = {
            providerContext: mockMapParameters.providerContext
        };

        const updateMapWalkthrough = require('../../service-walkthroughs/mapWalkthrough').updateMapWalkthrough;
        await updateMapWalkthrough(mockContext, mapParams, mockMapName);

        expect(printer.error).toBeCalledWith('No Map resource to update. Use "amplify add geo" to create a new Map.');
    });

    it('sets parameters based on user input for adding subsequent map walkthrough', async() => {
        mockAmplifyMeta.geo = {};
        mockAmplifyMeta.geo[secondaryMapName] = { ...mockMapParameters, ...secondaryMapResource, isDefault: true };
        mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        let mapParams: Partial<MapParameters> = {
            providerContext: mockMapParameters.providerContext
        };

        const createMapWalkthrough = require('../../service-walkthroughs/mapWalkthrough').createMapWalkthrough;
        mapParams = await createMapWalkthrough(mockContext, mapParams);

        expect(mockMapParameters).toMatchObject(mapParams);
    });

    it('sets the first map added as default automatically', async() => {
        let mapParams: Partial<MapParameters> = {
            providerContext: mockMapParameters.providerContext
        };
        mockAmplifyMeta.geo = {};
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        prompter.yesOrNo = jest.fn().mockReturnValue(false);

        const createMapWalkthrough = require('../../service-walkthroughs/mapWalkthrough').createMapWalkthrough;
        mapParams = await createMapWalkthrough(mockContext, mapParams);

        expect({ ...mockMapParameters, isDefault: true }).toMatchObject(mapParams);
        // map default setting question is skipped
        expect(prompter.yesOrNo).toBeCalledTimes(2);
        expect(prompter.yesOrNo).toBeCalledWith('Do you want to configure advanced settings?', false);
    });

    it('sets the resource to remove correctly', async() => {
        const removeWalkthrough = require('../../service-walkthroughs/removeWalkthrough').removeWalkthrough;
        expect(await(removeWalkthrough(mockContext, service))).toEqual(mockMapName);
    });

    it('early returns and prints error if no map resource to remove', async() => {
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

        expect(printer.error).toBeCalledWith(`No ${service} type resource exists in the project.`);
    });

    it('updates default map to another map if it is removed', async() => {
        mockContext.amplify.removeResource = jest.fn().mockReturnValue({
            catch: jest.fn()
        });

        // given the map to be removed is default
        mockAmplifyMeta.geo[mockMapName].isDefault = true;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const removeMapResource = require('../../provider-controllers/map').removeMapResource;
        
        expect(await(removeMapResource(mockContext))).toEqual(mockMapName);
        // The default map is now changed to secondary map
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockMapName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryMapName, "isDefault", true);
    });
});
