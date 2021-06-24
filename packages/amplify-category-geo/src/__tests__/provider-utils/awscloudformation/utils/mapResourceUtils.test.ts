import { $TSContext } from 'amplify-cli-core';
import { category } from '../../../../constants';

describe('Test Map resource utility functions', () => {
    const service = 'Map';
    const mockContext = ({
        amplify: {
            getProjectDetails: () => {
                return { 
                    amplifyMeta: {
                        geo: {
                            map1: {
                                service: service,
                                isDefaultMap: false
                            },
                            map2: {
                                service: service,
                                isDefaultMap: true
                            },
                            placeIndex1: {
                                service: 'PlaceIndex',
                                isDefaultPlaceIndex: true
                            }
                        }
                    }
                };
            },
            updateamplifyMetaAfterResourceUpdate: jest.fn()
        }
    } as unknown) as $TSContext;

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it('updates default map in amplify meta', () => {
        const updateDefaultMap = require('../../../../provider-utils/awscloudformation/utils/mapResourceUtils').updateDefaultMap;
        updateDefaultMap(mockContext);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(1);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map2', 'isDefaultMap', false
        );
    });
});