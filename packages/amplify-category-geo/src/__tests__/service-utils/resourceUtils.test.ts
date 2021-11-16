import { EsriMapStyleType, MapParameters } from '../../service-utils/mapParams';
import { merge, updateDefaultResource, readResourceMetaParameters, getGeoPricingPlan, updateGeoPricingPlan } from '../../service-utils/resourceUtils';
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
    pricingPlan: PricingPlan.MobileAssetManagement,
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
    pricingPlan: PricingPlan.MobileAssetManagement,
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
const geofenceCollection1Params = {
    service: ServiceName.GeofenceCollection,
    isDefault: false,
    providerPlugin: provider,
    dataProvider: DataProvider.Esri,
    groupPermissions: {},
    pricingPlan: PricingPlan.MobileAssetManagement,
    accessType: AccessType.CognitoGroups
};
const geofenceCollection2Params = {
    service: ServiceName.GeofenceCollection,
    isDefault: true,
    providerPlugin: provider,
    dataProvider: DataProvider.Here,
    groupPermissions: {},
    pricingPlan: PricingPlan.MobileAssetManagement,
    accessType: AccessType.CognitoGroups
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
                placeIndex2: placeIndex2Params,
                geofenceCollection1: geofenceCollection1Params,
                geofenceCollection2: geofenceCollection2Params
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

    it('updates given geofence collection as default in amplify meta', async() => {
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();
        await updateDefaultResource(mockContext, ServiceName.GeofenceCollection, 'geofenceCollection1');
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'geofenceCollection1', 'isDefault', true);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'geofenceCollection2', 'isDefault', false);
        expect(JSONUtilities.writeJson).toBeCalledTimes(2);
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/geofenceCollection1/parameters.json", {"isDefault": true});
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/geofenceCollection2/parameters.json", {"isDefault": false});
    });

    it('removes current default geofence collection if none is specified', async() => {
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();
        await updateDefaultResource(mockContext, ServiceName.GeofenceCollection);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(2);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'geofenceCollection1', 'isDefault', false);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'geofenceCollection2', 'isDefault', false);
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
                placeIndex2: placeIndex2Params,
                geofenceCollection1: geofenceCollection1Params,
                geofenceCollection2: geofenceCollection2Params
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

        const nonExistingGeofenceCollection = 'geofenceCollection12345';
        expect(async () => await readResourceMetaParameters(ServiceName.GeofenceCollection, nonExistingGeofenceCollection)).rejects.toThrowError(errorMessage(nonExistingGeofenceCollection));
    });
});

describe('Test reading the current pricing plan for Geo resources', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        stateManager.getMeta = jest.fn().mockReturnValue({
            geo: {
                map1: map1Params,
                map2: map2Params,
                placeIndex1: placeIndex1Params,
                placeIndex2: placeIndex2Params,
                geofenceCollection1: geofenceCollection1Params,
                geofenceCollection2: geofenceCollection2Params
            }
        });
    });

    it('reads the current Geo pricing plan correctly', async() => {
        const actualPricingPlan = await getGeoPricingPlan();
        expect(actualPricingPlan).toEqual(map1Params.pricingPlan);
    });

    it('gives the default pricing plan if none available', async() => {
        stateManager.getMeta = jest.fn().mockReturnValue({});
        const actualPricingPlan = await getGeoPricingPlan();
        expect(actualPricingPlan).toEqual(PricingPlan.RequestBasedUsage);
    });
});

describe('Test updating the pricing plan for all Geo resources', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        stateManager.getMeta = jest.fn().mockReturnValue({
            geo: {
                map1: map1Params,
                placeIndex1: placeIndex1Params,
                geofenceCollection1: geofenceCollection1Params
            }
        });
        pathManager.getBackendDirPath = jest.fn().mockReturnValue('');
        JSONUtilities.readJson = jest.fn().mockReturnValue({});
        JSONUtilities.writeJson = jest.fn().mockReturnValue('');
    });

    it('updates given pricing plan correctly for all Geo resources in project', async() => {
        mockContext.amplify.updateamplifyMetaAfterResourceUpdate = jest.fn();
        const updatedPricingPlan = PricingPlan.MobileAssetTracking;
        // check that current pricing plan is not same as pricing plan to be updated
        expect(map1Params.pricingPlan).not.toEqual(updatedPricingPlan);
        expect(placeIndex1Params.pricingPlan).not.toEqual(updatedPricingPlan);
        expect(geofenceCollection1Params.pricingPlan).not.toEqual(updatedPricingPlan);

        // update the pricing plan
        await updateGeoPricingPlan(mockContext, updatedPricingPlan);

        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledTimes(3);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'map1', 'pricingPlan', updatedPricingPlan);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'placeIndex1', 'pricingPlan', updatedPricingPlan);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceUpdate).toBeCalledWith(
            category, 'geofenceCollection1', 'pricingPlan', updatedPricingPlan);
        
        // pricing plan is also updated in the resource stack parameters
        expect(JSONUtilities.writeJson).toBeCalledTimes(3);
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/map1/parameters.json", {"pricingPlan": updatedPricingPlan});
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/placeIndex1/parameters.json", {"pricingPlan": updatedPricingPlan});
        expect(JSONUtilities.writeJson).toBeCalledWith("geo/geofenceCollection1/parameters.json", {"pricingPlan": updatedPricingPlan});
    });
});
