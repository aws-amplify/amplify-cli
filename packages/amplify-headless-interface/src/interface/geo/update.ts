import { AccessType } from './add';
/**
 * Defines the json object expected by `amplify update geo --headless`
 */
 export interface UpdateGeoRequest {
  /**
   * The schema version.
   */
  version: 1;
  /**
   * The service modification that will be interpreted by Amplify.
   */
  serviceModification: GeoServiceModification;
}

/**
 * Defines AWS Location Service parameters.
 */
export type GeoServiceModification = BaseGeoServiceModification & MapModification
/**
 * Modification that applies to all geo service configuration.
 */
export interface BaseGeoServiceModification {
  /**
   * The service name of the resource provider.
   */
  serviceName: string;
  /**
   * The name of the map that will be updated.
   */
  name: string;
  /**
   * Whether the geo resource added is set to default.
   */
  setAsDefault: boolean;
  /**
   * The access policy for geo resources.
   */
  accessType: AccessType
}

/**
 * Specifies modification for map.
 */
export interface MapModification {
  /**
   * The service name of the resource provider.
   */
  serviceName: 'Map';
}
