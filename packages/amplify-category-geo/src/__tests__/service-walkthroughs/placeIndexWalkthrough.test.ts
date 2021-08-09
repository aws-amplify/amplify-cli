import { $TSContext, $TSObject, stateManager, pathManager, JSONUtilities } from 'amplify-cli-core';
import { DataSourceIntendedUse, PlaceIndexParameters } from '../../service-utils/placeIndexParams';
import { AccessType, DataProvider, PricingPlan } from '../../service-utils/resourceParams';
import { provider, ServiceName } from '../../service-utils/constants';
import { category } from '../../constants';

jest.mock('amplify-cli-core');

describe('Search walkthrough works as expected', () => {
    const projectName = 'mockProject';
    const selectPromptMock = jest.fn();
    const service = ServiceName.PlaceIndex;
    const mockPlaceIndexName = 'mockindex12345';
    const secondaryPlaceIndexName = 'secondaryindex12345';
    const mockMapResource = {
        resourceName: 'map12345',
        service: ServiceName.Map,
        pricingPlan: PricingPlan.MobileAssetTracking
    };
    const mockPlaceIndexResource = {
        resourceName: mockPlaceIndexName,
        service: service
    };
    const secondaryPlaceIndexResource = {
        resourceName: secondaryPlaceIndexName,
        service: service,
    };
    const mockPlaceIndexParameters: PlaceIndexParameters = {
        providerContext: {
            provider: provider,
            service: service,
            projectName: projectName
        },
        name: mockPlaceIndexName,
        dataProvider: DataProvider.Esri,
        dataSourceIntendedUse: DataSourceIntendedUse.SingleUse,
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
            confirmPrompt: jest.fn().mockReturnValue(mockPlaceIndexParameters.isDefault),
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
                    mockUserInput['accessType'] = mockPlaceIndexParameters.accessType;
                }
                else if(questions[0].name === 'name') {
                    mockUserInput['name'] = mockPlaceIndexParameters.name;
                }
                else if(questions[0].name === 'dataProvider') {
                    mockUserInput['dataProvider'] = mockPlaceIndexParameters.dataProvider;
                }
                else if(questions[0].name === 'pricingPlanBusinessType') {
                    mockUserInput['pricingPlanBusinessType'] = true;
                }
                else if(questions[0].name === 'resourceName') {
                    mockUserInput['resourceName'] = mockPlaceIndexParameters.name;
                }
                else if(questions[0].name === 'defaultIndexName') {
                    mockUserInput['defaultIndexName'] = secondaryPlaceIndexName;
                }
            }
            return new Promise<any>((resolve) => {
                resolve(mockUserInput);
            });
        });

        mockAmplifyMeta.geo[mockPlaceIndexName] = { ...mockPlaceIndexParameters, ...mockPlaceIndexResource };
        mockAmplifyMeta.geo[secondaryPlaceIndexName] = { ...mockPlaceIndexParameters, ...secondaryPlaceIndexResource };
        mockAmplifyMeta.geo[mockMapResource.resourceName] = mockMapResource;

        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: [mockMapResource, secondaryPlaceIndexResource, mockPlaceIndexResource]
                });
            });
        });
        pathManager.getBackendDirPath = jest.fn().mockReturnValue('');
        JSONUtilities.readJson = jest.fn().mockReturnValue({});
        JSONUtilities.writeJson = jest.fn().mockReturnValue('');
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    });

    it('sets parameters based on user input for update place index walkthrough', async() => {
        // set initial place index parameters before update
        mockAmplifyMeta.geo[mockPlaceIndexName].accessType = AccessType.AuthorizedAndGuestUsers;
        mockAmplifyMeta.geo[mockPlaceIndexName].isDefault = true;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        // update the index's default settings to false; should set the secondary index as default
        mockContext.amplify.confirmPrompt = jest.fn().mockReturnValue(false);

        let indexParams: Partial<PlaceIndexParameters> = {
            providerContext: mockPlaceIndexParameters.providerContext
        };

        const updatePlaceIndexWalkthrough = require('../../service-walkthroughs/placeIndexWalkthrough').updatePlaceIndexWalkthrough;

        indexParams = await updatePlaceIndexWalkthrough(mockContext, indexParams, mockPlaceIndexName);

        // The default place index is now changed to secondary map
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockPlaceIndexName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryPlaceIndexName, "isDefault", true);
        
        // The place index parameters are updated
        expect(mockPlaceIndexParameters).toMatchObject(indexParams);
    });

    it('early returns and prints error if no place index resource to update', async() => {
        mockContext.amplify.getResourceStatus = jest.fn().mockImplementation(
            (category?: any, resourceName?: any, providerName?: any, filteredResources?: any): Promise<any> => {
            return new Promise<any>((resolve) => {
                resolve({
                    allResources: []
                });
            });
        });

        let indexParams: Partial<PlaceIndexParameters> = {
            providerContext: mockPlaceIndexParameters.providerContext
        };

        const updatePlaceIndexWalkthrough = require('../../service-walkthroughs/placeIndexWalkthrough').updatePlaceIndexWalkthrough;
        await updatePlaceIndexWalkthrough(mockContext, indexParams, mockPlaceIndexName);

        expect(mockContext.print.error).toBeCalledWith('No search index resource to update. Use "amplify add geo" to create a new search index.');
    });

    it('sets parameters based on user input for adding subsequent place index walkthrough', async() => {
        mockAmplifyMeta.geo = {};
        mockAmplifyMeta.geo[secondaryPlaceIndexName] = { ...mockPlaceIndexParameters, ...secondaryPlaceIndexResource, isDefault: true };
        mockAmplifyMeta.geo[mockMapResource.resourceName] = mockMapResource;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        let indexParams: Partial<PlaceIndexParameters> = {
            providerContext: mockPlaceIndexParameters.providerContext
        };

        const createPlaceIndexWalkthrough = require('../../service-walkthroughs/placeIndexWalkthrough').createPlaceIndexWalkthrough;
        indexParams = await createPlaceIndexWalkthrough(mockContext, indexParams);

        expect(mockPlaceIndexParameters).toMatchObject(indexParams);
    });

    it('sets the first place index added as default automatically', async() => {
        let indexParams: Partial<PlaceIndexParameters> = {
            providerContext: mockPlaceIndexParameters.providerContext
        };
        mockAmplifyMeta.geo = {};
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const createPlaceIndexWalkthrough = require('../../service-walkthroughs/placeIndexWalkthrough').createPlaceIndexWalkthrough;
        indexParams = await createPlaceIndexWalkthrough(mockContext, indexParams);

        expect({ ...mockPlaceIndexParameters, isDefault: true }).toMatchObject(indexParams);
        // place index default setting question is skipped
        expect(mockContext.amplify.confirmPrompt).toBeCalledTimes(2);
        expect(mockContext.amplify.confirmPrompt).toBeCalledWith('Do you want to configure advanced settings?', false);
    });

    it('sets the resource to remove correctly', async() => {
        const removeWalkthrough = require('../../service-walkthroughs/removeWalkthrough').removeWalkthrough;
        expect(await(removeWalkthrough(mockContext, service))).toEqual(mockPlaceIndexName);
    });

    it('early returns and prints error if no place index resource to remove', async() => {
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

    it('updates default place index to another place index if it is removed', async() => {
        mockContext.amplify.removeResource = jest.fn().mockReturnValue({
            catch: jest.fn()
        });

        // given the place index to be removed is default
        mockAmplifyMeta.geo[mockPlaceIndexName].isDefault = true;
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const removePlaceIndexResource = require('../../provider-controllers/placeIndex').removePlaceIndexResource;
        
        expect(await(removePlaceIndexResource(mockContext))).toEqual(mockPlaceIndexName);
        // The default place index is now changed to secondary place index
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, mockPlaceIndexName, "isDefault", false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate)
        .toBeCalledWith(category, secondaryPlaceIndexName, "isDefault", true);
    });

    afterEach(() => {
        selectPromptMock.mockClear();
    });
});