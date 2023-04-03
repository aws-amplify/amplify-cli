import { DataProvider, ResourceParameters } from './resourceParams';
export type MapParameters = ResourceParameters & {
    mapStyleType: MapStyleType;
    groupPermissions: string[];
};
export declare enum EsriMapStyleType {
    Navigation = "Navigation",
    Streets = "Streets",
    Topographic = "Topographic",
    DarkGrayCanvas = "DarkGrayCanvas",
    LightGrayCanvas = "LightGrayCanvas",
    Imagery = "Imagery"
}
export declare enum HereMapStyleType {
    Berlin = "Berlin",
    Explore = "Explore",
    ExploreTruck = "ExploreTruck",
    RasterSatellite = "RasterSatellite",
    HybridSatellite = "HybridSatellite"
}
export declare enum OpenDataMapStyleType {
    StandardLight = "StandardLight"
}
export type MapStyleType = EsriMapStyleType | HereMapStyleType | OpenDataMapStyleType;
export declare enum MapStyle {
    VectorEsriNavigation = "VectorEsriNavigation",
    VectorEsriStreets = "VectorEsriStreets",
    VectorEsriTopographic = "VectorEsriTopographic",
    VectorEsriDarkGrayCanvas = "VectorEsriDarkGrayCanvas",
    VectorEsriLightGrayCanvas = "VectorEsriLightGrayCanvas",
    RasterEsriImagery = "RasterEsriImagery",
    VectorHereBerlin = "VectorHereBerlin",
    VectorHereExplore = "VectorHereExplore",
    VectorHereExploreTruck = "VectorHereExploreTruck",
    RasterHereExploreSatellite = "RasterHereExploreSatellite",
    HybridHereExploreSatellite = "HybridHereExploreSatellite",
    VectorOpenDataStandardLight = "VectorOpenDataStandardLight"
}
export declare const isCompleteMapParams: (partial: Partial<MapParameters>) => partial is MapParameters;
export declare const convertToCompleteMapParams: (partial: Partial<MapParameters>) => MapParameters;
export declare const getGeoMapStyle: (dataProvider: DataProvider, mapStyleType: MapStyleType) => string;
export declare const getMapStyleComponents: (mapStyle: string) => Pick<MapParameters, 'dataProvider' | 'mapStyleType'>;
//# sourceMappingURL=mapParams.d.ts.map