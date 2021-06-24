import { $TSContext } from 'amplify-cli-core';
import { EsriMapStyleType, MapParameters } from '../../../../provider-utils/awscloudformation/utils/mapParams';
import { AccessType, DataProvider, PricingPlan } from '../../../../provider-utils/awscloudformation/utils/resourceParams';

describe('Map walkthrough works as expected', () => {
    const provider = 'awscloudformation';
    const projectName = 'mockProject';
    const selectPromptMock = jest.fn();
    const service = 'Map';
    const mockResource = {
        service: service,
        resourceName: "resource12345"
    };
    const mockParameters: Partial<MapParameters> = {
        providerContext: {
            provider: provider,
            service: service,
            projectName: projectName
        },
        mapName: mockResource.resourceName,
        mapStyleType: EsriMapStyleType.Streets,
        dataProvider: DataProvider.Esri,
        pricingPlan: PricingPlan.RequestBasedUsage,
        accessType: AccessType.AuthorizedAndGuestUsers,
        isDefaultMap: false
    };
    const mockContext = ({
        amplify: {
            serviceSelectionPrompt: async () => {
                return { service: service, providerName: provider};
            },
            getResourceStatus: jest.fn(),
            confirmPrompt: jest.fn().mockReturnValue(mockParameters.isDefaultMap),
            inputValidation: jest.fn()
        },
        print: {
            info: jest.fn(),
            error: jest.fn()
        }
    } as unknown) as $TSContext;
    
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
            }
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
        });
    });

    it('sets parameters based on user input for update map walkthrough', async() => {
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockResource]
                });
            });
        });

        let mapParams: Partial<MapParameters> = {
            providerContext: mockParameters.providerContext
        };

        const updateMapWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/mapWalkthrough').updateMapWalkthrough;

        mapParams = await updateMapWalkthrough(mockContext, mapParams, mockResource.resourceName);

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
        await updateMapWalkthrough(mockContext, mapParams, mockResource.resourceName);

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

    it('sets the resource to remove correctly', async() => {
        const mockPlaceResource = {
            service: "PlaceIndex",
            resourceName: "someOtherResource"
        };
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockResource, mockPlaceResource]
                });
            });
        });

        const removeWalkthrough = require('../../../../provider-utils/awscloudformation/service-walkthroughs/removeWalkthrough').removeWalkthrough;

        expect(await(removeWalkthrough(mockContext, service))).toEqual(mockResource.resourceName);

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

    afterEach(() => {
        selectPromptMock.mockClear();
    });
});