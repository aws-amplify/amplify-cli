import { EsriMapStyleType, MapParameters } from '../../service-utils/mapParams';
import { merge, updateDefaultResource, readResourceMetaParameters } from '../../service-utils/resourceUtils';
import { stateManager, $TSContext, pathManager, JSONUtilities } from 'amplify-cli-core';
import { provider, ServiceName } from '../../service-utils/constants';
import { MapStyle } from '../../service-utils/mapParams';
import { DataSourceIntendedUse } from '../../service-utils/placeIndexParams';
import { AccessType, DataProvider, PricingPlan } from '../../service-utils/resourceParams';
import { category } from '../../constants';

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

    it('merge utility function appends to existing keys', () => {
        const existingParams: Partial<MapParameters> = {
            'accessType': AccessType.AuthorizedUsers
        };

        const otherParams: Partial<MapParameters> = {
            'mapStyleType': EsriMapStyleType.Streets
        };

        const mergedParams = merge(existingParams, otherParams);
        expect(mergedParams).toEqual({...existingParams, ...otherParams});
    });
});

const map1Params = {
    service: ServiceName.Map,
    isDefault: false,
    providerPlugin: provider,
    mapStyle: MapStyle.VectorEsriNavigation,
    pricingPlan: PricingPlan.MobileAssetTracking,
    accessType: AccessType.AuthorizedAndGuestUsers
};
const map2Params = {
    service: ServiceName.Map,
    isDefault: true,
    providerPlugin: provider,
    mapStyle: MapStyle.VectorEsriStreets,
    pricingPlan: PricingPlan.MobileAssetManagement,
    accessType: AccessType.AuthorizedUsers
};
const placeIndex1Params = {
    service: ServiceName.PlaceIndex,
    isDefault: false,
    providerPlugin: provider,
    dataProvider: DataProvider.Esri,
    dataSourceIntendedUse: DataSourceIntendedUse.Storage,
    pricingPlan: PricingPlan.RequestBasedUsage,
    accessType: AccessType.AuthorizedAndGuestUsers
};
const placeIndex2Params = {
    service: ServiceName.PlaceIndex,
    isDefault: true,
    providerPlugin: provider,
    dataProvider: DataProvider.Here,
    dataSourceIntendedUse: DataSourceIntendedUse.SingleUse,
    pricingPlan: PricingPlan.MobileAssetManagement,
    accessType: AccessType.AuthorizedUsers
};

const mockContext = ({
    amplify: {
        updateamplifyMetaAfterResourceUpdate: jest.fn()
    }
} as unknown) as $TSContext;

describe('Test updating the default resource', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        stateManager.getMeta = jest.fn().mockReturnValue({
            geo: {
                map1: map1Params,
                map2: map2Params,
                placeIndex1: placeIndex1Params,
                placeIndex2: placeIndex2Params
            }
        });
        pathManager.getBackendDirPath = jest.fn().mockReturnValue('');
        JSONUtilities.readJson = jest.fn().mockReturnValue({});
        JSONUtilities.writeJson = jest.fn().mockReturnValue('');
    });

    it('updates given map as default in amplify meta', async() => {
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();
        await updateDefaultResource(mockContext, ServiceName.Map, 'map1');
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map1', 'isDefault', true);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map2', 'isDefault', false);
        expect(JSONUtilities.writeJson).toBeCalledTimes(2);
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/map1/parameters.json", {"isDefault": true});
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/map2/parameters.json", {"isDefault": false});
    });

    it('removes current default map if none is specified', async() => {
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();
        await updateDefaultResource(mockContext, ServiceName.Map);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map1', 'isDefault', false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map2', 'isDefault', false);
    });

    it('updates given place index as default in amplify meta', async() => {
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();
        await updateDefaultResource(mockContext, ServiceName.PlaceIndex, 'placeIndex1');
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'placeIndex1', 'isDefault', true);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'placeIndex2', 'isDefault', false);
        expect(JSONUtilities.writeJson).toBeCalledTimes(2);
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/placeIndex1/parameters.json", {"isDefault": true});
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/placeIndex2/parameters.json", {"isDefault": false});
    });

    it('removes current default place index if none is specified', async() => {
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();
        await updateDefaultResource(mockContext, ServiceName.PlaceIndex);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'placeIndex1', 'isDefault', false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'placeIndex2', 'isDefault', false);
    });
});

describe('Test reading the resource meta information', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        stateManager.getMeta = jest.fn().mockReturnValue({
            geo: {
                map1: map1Params,
                map2: map2Params,
                placeIndex1: placeIndex1Params,
                placeIndex2: placeIndex2Params
            }
        });
    });

    it('fails reading the meta information for non-existing resource', async() => {
        const nonExistingMap = 'map12345';
        const errorMessage = (resourceName: string): string => {
            return `Error reading Meta Parameters for ${resourceName}`;
        };
        expect(async () => await readResourceMetaParameters(ServiceName.Map, nonExistingMap)).rejects.toThrowError(errorMessage(nonExistingMap));

        const nonExistingPlaceIndex = 'placeIndex12345';
        expect(async () => await readResourceMetaParameters(ServiceName.PlaceIndex, nonExistingPlaceIndex)).rejects.toThrowError(errorMessage(nonExistingPlaceIndex));
    });
});
