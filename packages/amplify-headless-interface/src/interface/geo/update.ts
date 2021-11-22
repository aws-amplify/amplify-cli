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
  serviceName: string;
  name: string;
  setAsDefault: boolean;
  accessType: AccessType
}

export interface MapModification extends GeoModification {
  serviceName: "Map";
}