export type GeoConfig = {
    isFirstGeoResource?: boolean;
    isAdditional?: boolean;
    isDefault?: boolean;
    resourceName?: string;
    geoJSONFileName?: string;
    isRootLevelID?: boolean;
    customProperty?: string;
};
export declare function getGeoJSONFilePath(fileName: string): string;
/**
 * Add map with default values. Assume auth is already configured
 * @param cwd command directory
 */
export declare function addMapWithDefault(cwd: string, settings?: GeoConfig): Promise<void>;
/**
 * Add place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
export declare function addPlaceIndexWithDefault(cwd: string, settings?: GeoConfig): Promise<void>;
/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
export declare function addGeofenceCollectionWithDefault(cwd: string, groupNames: string[], settings?: GeoConfig): Promise<void>;
/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
export declare function importGeofencesWithDefault(cwd: string, settings?: GeoConfig): Promise<void>;
/**
 * Update an existing map with given settings. Assume auth is already configured
 * @param cwd command directory
 */
export declare function updateMapWithDefault(cwd: string): Promise<void>;
/**
 * Update the second map as default. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
export declare function updateSecondMapAsDefault(cwd: string): Promise<void>;
/**
 * Update an existing place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
export declare function updatePlaceIndexWithDefault(cwd: string): Promise<void>;
/**
 * Update the second place index as default. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
export declare function updateSecondPlaceIndexAsDefault(cwd: string): Promise<void>;
/**
 * Update an existing geofence collection with given settings. Assume auth is already configured
 * @param cwd command directory
 */
export declare function updateGeofenceCollectionWithDefault(cwd: string, groupNames: string[]): Promise<void>;
/**
 * Update the second geofence collection as default. Assume auth is already configured and two geofence collections added with first default
 * @param cwd command directory
 */
export declare function updateSecondGeofenceCollectionAsDefault(cwd: string, groupNames: string[]): Promise<void>;
/**
 * Remove an existing map. Assume auth is already configured
 * @param cwd command directory
 */
export declare function removeMap(cwd: string): Promise<void>;
/**
 * Remove an existing default map. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
export declare function removeFirstDefaultMap(cwd: string): Promise<void>;
/**
 * Remove an existing place index. Assume auth is already configured
 * @param cwd command directory
 */
export declare function removePlaceIndex(cwd: string): Promise<void>;
/**
 * Remove an existing default index. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
export declare function removeFirstDefaultPlaceIndex(cwd: string): Promise<void>;
/**
 * Remove an existing geofence collection. Assume auth is already configured
 * @param cwd command directory
 */
export declare function removeGeofenceCollection(cwd: string): Promise<void>;
/**
 * Remove an existing default geofence collection. Assume auth is already configured and two geofence collections added with first default
 * @param cwd command directory
 */
export declare function removeFirstDefaultGeofenceCollection(cwd: string): Promise<void>;
/**
 * Get Geo configuration from aws-exports
 */
export declare function getGeoJSConfiguration(awsExports: any): any;
export declare function generateResourceIdsInOrder(count: number): string[];
export declare function getGeoJSONObj(geoJSONFileName: string): any;
