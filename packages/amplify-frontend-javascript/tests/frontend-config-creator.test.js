const configCreator = require("../lib/frontend-config-creator");
jest.mock('amplify-cli-core');

const mapServiceName = 'Map';
const placeIndexServiceName = 'PlaceIndex';

describe('generate maps and search configuration', () => {

    function constructMapMeta(mapName, mapStyle, isDefault, region) {
        return {
            service: mapServiceName,
            output: {
                Style: mapStyle,
                Name: mapName,
                Region: region
            },
            isDefault: isDefault
        };
    }

    function constructPlaceIndexMeta(indexName, isDefault, region) {
        return {
            service: placeIndexServiceName,
            output: {
                Name: indexName,
                Region: region
            },
            isDefault: isDefault
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('generates correct configuration for maps and search geo resources without Region CFN output', () => {
        const projectRegion = 'us-west-2';
        const mockGeoResources = {
            serviceResourceMapping: {
                Map: [
                    constructMapMeta('map12345', 'VectorEsriStreets', false),
                    constructMapMeta('defaultMap12345', 'VectorEsriStreets', true)
                ],
                PlaceIndex: [
                    constructPlaceIndexMeta('index12345', false),
                    constructPlaceIndexMeta('defaultIndex12345', true)
                ]
            },
            metadata: {
                Region: projectRegion
            }
        };
        const generatedConfig = configCreator.getAWSExportsObject(mockGeoResources);
        expect(generatedConfig.geo.amazon_location_service.region).toEqual(projectRegion);
        expect(generatedConfig).toMatchSnapshot();
    });

    it('does not add any geo configuration if no maps or search is added', () => {
        const mockGeoResources = {
            serviceResourceMapping: {},
            metadata: {
                Region: 'us-west-2'
            }
        };
        const generatedConfig = configCreator.getAWSExportsObject(mockGeoResources);
        expect(generatedConfig.geo).toBeUndefined();
    });

    it('generates correct configuration for maps and search geo resources with Region as CFN output', () => {
        const resourceRegion = 'eu-west-1';
        const projectRegion = 'eu-west-2';
        const mockGeoResources = {
            serviceResourceMapping: {
                Map: [
                    constructMapMeta('map12345', 'VectorEsriStreets', false, resourceRegion),
                    constructMapMeta('defaultMap12345', 'VectorEsriStreets', true, resourceRegion)
                ],
                PlaceIndex: [
                    constructPlaceIndexMeta('index12345', false, resourceRegion),
                    constructPlaceIndexMeta('defaultIndex12345', true, resourceRegion)
                ]
            },
            metadata: {
                Region: projectRegion
            }
        };
        const generatedConfig = configCreator.getAWSExportsObject(mockGeoResources);
        expect(generatedConfig.geo.amazon_location_service.region).toEqual(resourceRegion);
        expect(generatedConfig).toMatchSnapshot();
    });
});