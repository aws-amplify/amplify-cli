import { $TSContext } from 'amplify-cli-core';
import { category } from '../../../../constants';

describe('Test Map resource utility functions', () => {
    const service = 'Map';
    const mockContext = ({
        amplify: {
            getProjectMeta: jest.fn(),
            updateamplifyMetaAfterResourceUpdate: jest.fn()
        }
    } as unknown) as $TSContext;

    beforeEach(() => {
        jest.clearAllMocks();
    });


    it('updates default map in amplify meta', async() => {
        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue({
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
        });
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();

        const updateDefaultMap = require('../../../../provider-utils/awscloudformation/utils/mapResourceUtils').updateDefaultMap;
        await updateDefaultMap(mockContext, 'map1');
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map2', 'isDefaultMap', false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map1', 'isDefaultMap', true);
    });
});