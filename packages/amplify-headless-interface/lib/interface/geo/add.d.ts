export interface AddGeoRequest {
    version: 1;
    serviceConfiguration: GeoServiceConfiguration;
}
export type GeoServiceConfiguration = BaseGeoServiceConfiguration & MapConfiguration;
export interface BaseGeoServiceConfiguration {
    serviceName: string;
    name: string;
    accessType: AccessType;
    setAsDefault: boolean;
}
export interface MapConfiguration {
    serviceName: 'Map';
    mapStyle: MapStyle;
}
export declare enum AccessType {
    AuthorizedUsers = "AuthorizedUsers",
    AuthorizedAndGuestUsers = "AuthorizedAndGuestUsers"
}
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
//# sourceMappingURL=add.d.ts.map