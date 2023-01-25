const configHelper = require('../../amplify-frontend-android/lib/amplify-config-helper');
jest.mock('amplify-cli-core');

const mapServiceName = 'Map';
const placeIndexServiceName = 'PlaceIndex';

describe('generate maps and search configuration', () => {
    const mockAmplifyMeta = {
        providers: {
            awscloudformation: {
                Region: 'us-west-2'
            }
        },
        geo: {
            map12345: constructMapMeta('map12345', 'VectorEsriStreets', false),
            index12345: constructPlaceIndexMeta('index12345', false),
            defaultMap12345: constructMapMeta('defaultMap12345', 'VectorEsriStreets', true),
            defaultIndex12345: constructPlaceIndexMeta('defaultIndex12345', true)
        }
    };

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
    let mockContext = {}
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                getProjectMeta: jest.fn()
            }
        };
        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    });

    it('generates correct configuration for maps and search geo resources without Region CFN output', () => {
        const generatedConfig = configHelper.generateConfig(mockContext, {});
        expect(generatedConfig).toMatchSnapshot();
    });

    it('does not add any geo configuration if no maps or search is added', () => {
        mockAmplifyMeta.geo = {};
        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        const generatedConfig = configHelper.generateConfig(mockContext, {});
        expect(generatedConfig).toMatchSnapshot();
    });

    it('generates correct configuration for maps and search geo resources with Region as CFN output', () => {
        const resourceRegion = 'eu-west-1';
        const projectRegion = 'eu-west-2';
        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue({
            providers: {
                awscloudformation: {
                    Region: projectRegion
                }
            },
            geo: {
                map12345: constructMapMeta('map12345', 'VectorEsriStreets', false, resourceRegion),
                index12345: constructPlaceIndexMeta('index12345', false, resourceRegion),
                defaultMap12345: constructMapMeta('defaultMap12345', 'VectorEsriStreets', true, resourceRegion),
                defaultIndex12345: constructPlaceIndexMeta('defaultIndex12345', true, resourceRegion)
            }
        });
        const generatedConfig = configHelper.generateConfig(mockContext, {});
        expect(generatedConfig.geo.plugins.awsLocationGeoPlugin.region).toEqual(resourceRegion);
        expect(generatedConfig).toMatchSnapshot();
    });
});
