import { stateManager } from 'amplify-cli-core';
import { provider, ServiceName } from '../../service-utils/constants';
import { getMapStyleComponents, MapStyle } from '../../service-utils/mapParams';
import { DataSourceIntendedUse } from '../../service-utils/placeIndexParams';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';
import { getCurrentMapParameters, getMapFriendlyNames } from '../../service-utils/mapUtils';
import { getCurrentPlaceIndexParameters } from '../../service-utils/placeIndexUtils';
import { getCurrentGeofenceCollectionParameters } from '../../service-utils/geofenceCollectionUtils';

jest.mock('amplify-cli-core');

describe('Test resource utility functions', () => {
    const map1Params = {
        service: ServiceName.Map,
        isDefault: false,
        providerPlugin: provider,
        mapStyle: MapStyle.VectorEsriNavigation,
        accessType: AccessType.AuthorizedAndGuestUsers
    };
    const map2Params = {
        service: ServiceName.Map,
        isDefault: true,
        providerPlugin: provider,
        mapStyle: MapStyle.VectorEsriStreets,
        accessType: AccessType.AuthorizedUsers
    };
    const placeIndex1Params = {
        service: ServiceName.PlaceIndex,
        isDefault: false,
        providerPlugin: provider,
        dataProvider: DataProvider.Esri,
        dataSourceIntendedUse: DataSourceIntendedUse.Storage,
        accessType: AccessType.AuthorizedAndGuestUsers
    };
    const placeIndex2Params = {
        service: ServiceName.PlaceIndex,
        isDefault: true,
        providerPlugin: provider,
        dataProvider: DataProvider.Here,
        dataSourceIntendedUse: DataSourceIntendedUse.SingleUse,
        accessType: AccessType.AuthorizedUsers
    };
    const geofenceCollection1Params = {
        service: ServiceName.GeofenceCollection,
        isDefault: false,
        providerPlugin: provider,
        accessType: AccessType.CognitoGroups
    };

    beforeEach(() => {
        jest.clearAllMocks();
        stateManager.getMeta = jest.fn().mockReturnValue({
            geo: {
                map1: map1Params,
                map2: map2Params,
                placeIndex1: placeIndex1Params,
                placeIndex2: placeIndex2Params,
                geofenceCollection1: geofenceCollection1Params
            }
        });
    });


    it('gets current map parameters', async() => {
        const groupPermissions = ['mockCognitoGroup'];
        stateManager.getResourceInputsJson = jest.fn().mockReturnValue({groupPermissions: groupPermissions});
        const mapParams = await getCurrentMapParameters('map1');
        expect({
            ...getMapStyleComponents(map1Params.mapStyle),
            accessType: map1Params.accessType,
            isDefault: map1Params.isDefault,
            groupPermissions: groupPermissions
        }).toEqual(mapParams);
    });

    it('generates friendly names for maps containing the map styles', async() => {
        const mapFriendlyNames = await getMapFriendlyNames(['map1', 'map2']);
        expect(mapFriendlyNames).toEqual([
            `map1 (${map1Params.mapStyle})`,
            `map2 (${map2Params.mapStyle})`
        ]);
    });

    it('gets current place index parameters', async() => {
        const groupPermissions = ['mockCognitoGroup'];
        stateManager.getResourceInputsJson = jest.fn().mockReturnValue({groupPermissions: groupPermissions});
        const placeIndexParams = await getCurrentPlaceIndexParameters('placeIndex1');
        expect({
            dataProvider: placeIndex1Params.dataProvider,
            dataSourceIntendedUse: placeIndex1Params.dataSourceIntendedUse,
            accessType: placeIndex1Params.accessType,
            isDefault: placeIndex1Params.isDefault,
            groupPermissions: groupPermissions
        }).toEqual(placeIndexParams);
    });

    it('gets current geofence collection parameters', async() => {
        const groupPermissions = {
            mockCognitoGroup: [
                "Read geofence",
                "Create/Update geofence"
            ]
        }
        stateManager.getResourceInputsJson = jest.fn().mockReturnValue({groupPermissions: groupPermissions});
        const geofenceCollectionParams = await getCurrentGeofenceCollectionParameters('geofenceCollection1');
        expect({
            accessType: geofenceCollection1Params.accessType,
            isDefault: geofenceCollection1Params.isDefault,
            groupPermissions: groupPermissions
        }).toEqual(geofenceCollectionParams);
    });
});
