/**
 * Defines the json object expected by `amplify add geo --headless`
 */
 export interface AddGeoRequest {
  /**
   * The schema version.
   */
  version: 1;
  /**
   * The service configuration that will be interpreted by Amplify.
   */
  serviceConfiguration: GeoServiceConfiguration;
}

/**
 * Defines AWS Location Service parameters.
 */
export type GeoServiceConfiguration = BaseGeoServiceConfiguration & MapConfiguration;

/**
 * Configuration that applies to all geo service configuration.
 */
export interface BaseGeoServiceConfiguration {
  /**
   * The service name of the resource provider.
   */
  serviceName: string;
  /**
   * The name of the map that will be created.
   */
  name: string;
  /**
   * The access policy for geo resources.
   */
  accessType: AccessType;
  /**
   * Whether the geo resource added is set to default.
   */
  setAsDefault: boolean;
}
/**
 * Specifies configuration for map.
 */
export interface MapConfiguration {
  /**
   * The service name of the resource provider.
   */
  serviceName: "Map";
  /**
   * The map style type.
   */
  mapStyle: MapStyle;
}

/**
 * Definition of access type
 */
export enum AccessType {
  AuthorizedUsers = "AuthorizedUsers",
  AuthorizedAndGuestUsers = "AuthorizedAndGuestUsers"
}

/**
 * Supported Geo Map Styles
 */
 export enum MapStyle {
  VectorEsriNavigation = "VectorEsriNavigation",
  VectorEsriStreets = "VectorEsriStreets",
  VectorEsriTopographic = "VectorEsriTopographic",
  VectorEsriDarkGrayCanvas = "VectorEsriDarkGrayCanvas",
  VectorEsriLightGrayCanvas = "VectorEsriLightGrayCanvas",
  VectorHereBerlin = "VectorHereBerlin",
  VectorHereExplore = "VectorHereExplore",
  VectorHereExploreTruck = "VectorHereExploreTruck"
}
