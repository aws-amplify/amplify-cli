import { $TSContext, $TSObject, stateManager } from 'amplify-cli-core';
import { EsriMapStyleType, getGeoMapStyle, MapParameters, MapStyle } from '../../service-utils/mapParams';
import { AccessType, DataProvider, PricingPlan } from '../../service-utils/resourceParams';
import { provider, ServiceName } from '../../service-utils/constants';
import { category } from '../../constants';

jest.mock('amplify-cli-core');

describe('Map walkthrough works as expected', () => {
    const projectName = 'mockProject';
    const selectPromptMock = jest.fn();
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
            confirmPrompt: jest.fn().mockReturnValue(mockMapParameters.isDefault),
            inputValidation: jest.fn(),
            getProjectMeta: jest.fn(),
            updateamplifyMetaAfterResourceUpdate: jest.fn()
        },
        print: {
            info: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        },
        usageData: { emitError: jest.fn() }
    } as unknown) as $TSContext;

    // construct mock amplify meta
    const mockAmplifyMeta: $TSObject = {
        geo: {}
    };
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mock('inquirer', () => ({
            prompt: selectPromptMock
        }));

        selectPromptMock.mockImplementation((questions: any): Promise<any> => {
            let mockUserInput: $TSObject = {};
            if (questions && questions[0] && questions[0].name) {
                if(questions[0].name === 'accessType') {
                    mockUserInput['accessType'] = mockMapParameters.accessType;
                }
                else if(questions[0].name === 'name') {
                    mockUserInput['name'] = mockMapParameters.name;
                }
                else if(questions[0].name === 'mapStyle') {
                    mockUserInput['mapStyle'] = getGeoMapStyle(mockMapParameters.dataProvider, mockMapParameters.mapStyleType);
                }
                else if(questions[0].name === 'pricingPlanBusinessType') {
                    mockUserInput['pricingPlanBusinessType'] = true;
                }
                else if(questions[0].name === 'resourceName') {
                    mockUserInput['resourceName'] = mockMapParameters.name;
                }
                else if(questions[0].name === 'defaultMapName') {
                    mockUserInput['defaultMapName'] = secondaryMapName;
                }
            }
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
        });

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
    });

    it('sets parameters based on user input for update map walkthrough', async() => {
        // set initial map parameters before update
        mockAmplifyMeta.geo[mockMapName].accessType = AccessType.AuthorizedAndGuestUsers;
        mockAmplifyMeta.geo[mockMapName].isDefault = true;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        // update the map's default settings to false; should set the secondary map as default
        mockContext.amplify.confirmPrompt = jest.fn().mockReturnValue(false);

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

        expect(mockContext.print.error).toBeCalledWith('No Map resource to update. Use "amplify add geo" to create a new Map.');
    });

    it('sets parameters based on user input for adding subsequent map walkthrough', async() => {
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

        const createMapWalkthrough = require('../../service-walkthroughs/mapWalkthrough').createMapWalkthrough;
        mapParams = await createMapWalkthrough(mockContext, mapParams);

        expect({ ...mockMapParameters, isDefault: true }).toMatchObject(mapParams);
        // map default setting question is skipped
        expect(mockContext.amplify.confirmPrompt).toBeCalledTimes(2);
        expect(mockContext.amplify.confirmPrompt).toBeCalledWith('Do you want to configure advanced settings?', false);
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

        expect(mockContext.print.error).toBeCalledWith(`No ${service} type resource exists in the project.`);
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

    afterEach(() => {
        selectPromptMock.mockClear();
    });
});