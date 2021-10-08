import { AccessType } from "./add";
/**
 * Defines the json object expected by `amplify update geo --headless`
 */
 export interface UpdateGeoRequest {
  /**
   * The schema version.
   */
  version: 1;
  /**
   * The service configuration that will be interpreted by Amplify.
   */
  serviceModification: GeoModification;
}

export interface GeoModification {
  serviceType: string;
  name: string;
  isDefault: boolean;
  accessType: AccessType
}

export interface MapModification extends GeoModification {
  serviceType: "Map";
}

export interface PlaceIndexModification extends GeoModification {
  serviceType: "PlaceIndex";
}