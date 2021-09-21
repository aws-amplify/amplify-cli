const configHelper = require("../../amplify-frontend-android/lib/amplify-config-helper");
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

    function constructMapMeta(mapName, mapStyle, isDefault) {
        return {
            service: mapServiceName,
            output: {
                Style: mapStyle,
                Name: mapName
            },
            isDefault: isDefault
        };
    }

    function constructPlaceIndexMeta(indexName, isDefault) {
        return {
            service: placeIndexServiceName,
            output: {
                Name: indexName
            },
            isDefault: isDefault
        };
    }

    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                getProjectMeta: jest.fn()
            }
        };
        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    });

    it('generates correct configuration for maps and search geo resources', () => {
        const generatedConfig = configHelper.generateConfig(mockContext, {});
        expect(generatedConfig).toMatchSnapshot();
    });

    it('does not add any geo configuration if no maps or search is added', () => {
        mockAmplifyMeta.geo = {};
        mockContext.amplify.getProjectMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        const generatedConfig = configHelper.generateConfig(mockContext, {});
        expect(generatedConfig).toMatchSnapshot();
    });
});
