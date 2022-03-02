/**
 * Defines the json object expected by `amplify remove geo --headless`
 */
 export interface RemoveGeoRequest {
  /**
   * The schema version.
   */
  version: 1;
  /**
   * The service removal that will be interpreted by Amplify.
   */
  serviceRemoval: GeoServiceRemoval;
}
/**
 * Defines the removed AWS Location Service parameters.
 */
 export type GeoServiceRemoval = BaseGeoServiceRemoval & MapRemoval;

 /**
  * Configuration that applies to all geo service removal.
  */
 export interface BaseGeoServiceRemoval {
   /**
    * The service name of the resource provider.
    */
   serviceName: string;
   /**
    * The name of the map that will be removed.
    */
   name: string;
   /**
    * Optional param. The name of new default resource when the removed one is default
    */
   newDefaultResourceName?: string;
 }
 /**
  * Specifies configuration for map.
  */
 export interface MapRemoval {
   /**
    * The service name of the resource provider.
    */
   serviceName: "Map";
 }