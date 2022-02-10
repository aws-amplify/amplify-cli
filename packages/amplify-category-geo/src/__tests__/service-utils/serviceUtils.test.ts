import { stateManager } from 'amplify-cli-core';
import { provider, ServiceName } from '../../service-utils/constants';
import { getMapStyleComponents, MapStyle } from '../../service-utils/mapParams';
import { DataSourceIntendedUse } from '../../service-utils/placeIndexParams';
import { AccessType, DataProvider } from '../../service-utils/resourceParams';

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


    it('gets current map parameters from meta file', async() => {
        const getCurrentMapParameters = require('../../service-utils/mapUtils').getCurrentMapParameters;
        const mapParams = await getCurrentMapParameters('map1');
        expect({
            ...getMapStyleComponents(map1Params.mapStyle),
            accessType: map1Params.accessType,
            isDefault: map1Params.isDefault
        }).toEqual(mapParams);
    });

    it('generates friendly names for maps containing the map styles', async() => {
        const getMapFriendlyNames = require('../../service-utils/mapUtils').getMapFriendlyNames;
        const mapFriendlyNames = await getMapFriendlyNames(['map1', 'map2']);
        expect(mapFriendlyNames).toEqual([
            `map1 (${map1Params.mapStyle})`,
            `map2 (${map2Params.mapStyle})`
        ]);
    });

    it('gets current place index parameters from meta file', async() => {
        const getCurrentPlaceIndexParameters = require('../../service-utils/placeIndexUtils').getCurrentPlaceIndexParameters;
        const placeIndexParams = await getCurrentPlaceIndexParameters('placeIndex1');
        expect({
            dataProvider: placeIndex1Params.dataProvider,
            dataSourceIntendedUse: placeIndex1Params.dataSourceIntendedUse,
            accessType: placeIndex1Params.accessType,
            isDefault: placeIndex1Params.isDefault
        }).toEqual(placeIndexParams);
    });
});