import { $TSContext } from 'amplify-cli-core';
import { EsriMapStyleType, MapParameters, MapStyle } from '../../../../provider-utils/awscloudformation/utils/mapParams';
import { AccessType, DataProvider, PricingPlan } from '../../../../provider-utils/awscloudformation/utils/resourceParams';

describe('Map walkthrough works as expected', () => {
    const provider = 'awscloudformation';
    const projectName = 'mockProject';
    const selectPromptMock = jest.fn();
    const service = 'Map';
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
        isDefaultMap: false,
        mapStyle: MapStyle.VectorEsriStreets
    };
    const mockPlaceIndexResource = {
        resourceName: 'placeIndex12345',
        service: 'PlaceIndex'
    };

    const mockParameters: Partial<MapParameters> = {
        providerContext: {
            provider: provider,
            service: service,
            projectName: projectName
        },
        mapName: mockMapName,
        mapStyleType: EsriMapStyleType.Streets,
        dataProvider: DataProvider.Esri,
        pricingPlan: PricingPlan.RequestBasedUsage,
        accessType: AccessType.AuthorizedUsers,
        isDefaultMap: false
    };

    const mockContext = ({
        amplify: {
            serviceSelectionPrompt: async () => {
                return { service: service, providerName: provider};
            },
            getResourceStatus: jest.fn(),
            confirmPrompt: jest.fn().mockReturnValue(mockParameters.isDefaultMap),
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
    const mockAmplifyMeta = {
        geo: {}
    };
    
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mock('inquirer', () => ({
            prompt: selectPromptMock
        }));

        selectPromptMock.mockImplementation((questions: any): Promise<any> => {
            let mockUserInput = {};
            if (questions && questions[0] && questions[0].name) {
                if(questions[0].name === 'accessType') {
                    mockUserInput['accessType'] = mockParameters.accessType;
                }
                else if(questions[0].name === 'mapName') {
                    mockUserInput['mapName'] = mockParameters.mapName;
                }
                else if(questions[0].name === 'dataProvider') {
                    mockUserInput['dataProvider'] = mockParameters.dataProvider;
                }
                else if(questions[0].name === 'mapStyleType') {
                    mockUserInput['mapStyleType'] = mockParameters.mapStyleType;
                }
                else if(questions[0].name === 'pricingPlan') {
                    mockUserInput['pricingPlan'] = mockParameters.pricingPlan;
                }
                else if(questions[0].name === 'resourceName') {
                    mockUserInput['resourceName'] = mockParameters.mapName;
                }
                else if(questions[0].name === 'defaultMapName') {
                    mockUserInput['defaultMapName'] = secondaryMapName;
                }
            }
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
        });

        mockAmplifyMeta.geo[mockMapName] = { ...mockParameters, ...mockMapResource };
        mockAmplifyMeta.geo[secondaryMapName] = { ...mockParameters, ...secondaryMapResource };
        mockAmplifyMeta.geo[mockPlaceIndexResource.resourceName] = mockPlaceIndexResource;
    });

    it('sets parameters based on user input for update map walkthrough', async() => {
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockMapResource, secondaryMapResource, mockPlaceIndexResource]
                });
            });
        });

        // set initial resource parameters before update
        mockAmplifyMeta.geo[mockMapName].accessType = AccessType.AuthorizedAndGuestUsers;
        mockAmplifyMeta.geo[mockMapName].isDefaultMap = true;

        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        // update the map's default settings to false; should set the secondary map as default
        mockContext.amplify.confirmPrompt = jest.fn().mockReturnValue(false);

        let mapParams: Partial<MapParameters> = {
            providerContext: mockParameters.providerContext
        };

        const updateMapWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/mapWalkthrough').updateMapWalkthrough;

        mapParams = await updateMapWalkthrough(mockContext, mapParams, mockMapName);

        // The default map is now changed to secondary map
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith("geo", "mockmap12345", "isDefaultMap", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith("geo", "secondarymap12345", "isDefaultMap", true);
        
        // The map parameters are updated
        expect(mockParameters).toMatchObject(mapParams);
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
            providerContext: mockParameters.providerContext
        };

        const updateMapWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/mapWalkthrough').updateMapWalkthrough;
        await updateMapWalkthrough(mockContext, mapParams, mockMapName);

        expect(mockContext.print.error).toBeCalledWith('No Map resource to update. Use "amplify add geo" to create a new Map.');
    });

    it('sets parameters based on user input for add map walkthrough', async() => {
        let mapParams: Partial<MapParameters> = {
            providerContext: mockParameters.providerContext
        };

        const createMapWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/mapWalkthrough').createMapWalkthrough;
        mapParams = await createMapWalkthrough(mockContext, mapParams);

        expect(mockParameters).toMatchObject(mapParams);
    });

    it('sets the first map added as default automatically', async() => {
        let mapParams: Partial<MapParameters> = {
            providerContext: mockParameters.providerContext
        };
        mockAmplifyMeta.geo = {};

        const createMapWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/mapWalkthrough').createMapWalkthrough;
        mapParams = await createMapWalkthrough(mockContext, mapParams);

        expect({ ...mockParameters, isDefaultMap: true }).toMatchObject(mapParams);
        expect(mockContext.amplify.confirmPrompt).toBeCalledTimes(0);
    });

    it('sets the resource to remove correctly', async() => {
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockMapResource, secondaryMapResource, mockPlaceIndexResource]
                });
            });
        });

        const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeWalkthrough').removeWalkthrough;

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

        const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeWalkthrough').removeWalkthrough;
        await removeWalkthrough(mockContext, service);

        expect(mockContext.print.error).toBeCalledWith(`No ${service} type resource exists in the project.`);
    });

    it('updates default map to another map if it is removed', async() => {
        mockContext.amplify.removeResource = jest.fn().mockReturnValue({
            catch: jest.fn()
        });
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockMapResource, secondaryMapResource, mockPlaceIndexResource]
                });
            });
        });

        // given the map to be removed is default
        mockAmplifyMeta.geo[mockMapName].isDefaultMap = true;
        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const removeMapResource = require('../../../../provider-utils/awscloudformation/index').removeMapResource;
        
        expect(await(removeMapResource(mockContext, service))).toEqual(mockMapName);
        // The default map is now changed to secondary map
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith("geo", "mockmap12345", "isDefaultMap", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith("geo", "secondarymap12345", "isDefaultMap", true);
    });

    afterEach(() => {
        selectPromptMock.mockClear();
    });
});