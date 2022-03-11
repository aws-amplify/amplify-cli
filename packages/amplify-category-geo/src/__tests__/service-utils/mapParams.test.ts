import { getGeoMapStyle, getMapStyleComponents } from "../../service-utils/mapParams";

describe('map style construction works as expected', () => {
    const mapStyles = [
        "VectorEsriStreets",
        "VectorEsriNavigation",
        "VectorEsriTopographic",
        "VectorEsriDarkGrayCanvas",
        "VectorEsriLightGrayCanvas",
        "VectorHereBerlin",
        "RasterEsriImagery"
    ];

    it('parses various supported map styles', () => {
        mapStyles.forEach(mapStyle => {
            const { dataProvider, mapStyleType } = getMapStyleComponents(mapStyle);
            expect(getGeoMapStyle(dataProvider, mapStyleType)).toEqual(mapStyle);
        });
    });

    it('throws appropriate error for unsupported map style', () => {
        const invalidMapStyle = 'VectorRandomStyle';
        expect(() => {
            getMapStyleComponents(invalidMapStyle)
        }).toThrowError(`Invalid map style ${invalidMapStyle}`);
    });
});
