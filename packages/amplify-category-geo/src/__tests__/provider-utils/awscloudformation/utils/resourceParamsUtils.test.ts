import { EsriMapStyleType } from '../../../../provider-utils/awscloudformation/utils/mapParams';
import { AccessType } from '../../../../provider-utils/awscloudformation/utils/resourceParams';
import { merge } from '../../../../provider-utils/awscloudformation/utils/resourceParamsUtils';

describe('parameter merge utility function works as expected', () => {
    it('merge utility function retains existing value', () => {
        const existingParams = {
            'accessType': AccessType.AuthorizedUsers
        };

        const otherParams = {
            'accessType': AccessType.AuthorizedAndGuestUsers
        };

        const mergedParams = merge(existingParams, otherParams);
        expect(mergedParams).toEqual(existingParams);
    });

    it('merge utility function appends to existing value', () => {
        const existingParams = {
            'accessType': AccessType.AuthorizedUsers
        };

        const otherParams = {
            'mapStyleType': EsriMapStyleType.Streets
        };

        const mergedParams = merge(existingParams, otherParams);
        expect(mergedParams).toEqual({...existingParams, ...otherParams});
    });
});
