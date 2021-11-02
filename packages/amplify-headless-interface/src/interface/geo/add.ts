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

export interface GeoServiceConfiguration {
  serviceName: string;
  name: string;
  accessType: AccessType;
  pricingPlan: PricingPlan;
  setAsDefault: boolean;
}
export interface MapConfiguration extends GeoServiceConfiguration {
  serviceName: "Map";
  mapStyle: MapStyle;
}

export enum PricingPlan {
  RequestBasedUsage = "RequestBasedUsage",
  MobileAssetTracking = "MobileAssetTracking",
  MobileAssetManagement = "MobileAssetManagement"
}

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
}