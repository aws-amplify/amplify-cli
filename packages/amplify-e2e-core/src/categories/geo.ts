import { getCLIPath, nspawn as spawn, generateRandomShortId } from '..';
import path from 'path';

export type GeoConfig = {
  isFirstGeoResource?: boolean;
  isAdditional?: boolean;
  isDefault?: boolean;
  resourceName?: string;
  geoJSONFileName?: string;
  isRootLevelID?: boolean;
  customProperty?: string;
};

const defaultGeoConfig: GeoConfig = {
  isFirstGeoResource: false,
  isAdditional: false,
  isDefault: true,
  resourceName: '\r',
  geoJSONFileName: 'valid-root-level-id.json',
  isRootLevelID: true,
  customProperty: 'name'
};

const defaultSearchIndexQuestion = `Set this search index as the default? It will be used in Amplify search index API calls if no explicit reference is provided.`;
const defaultMapQuestion = `Set this Map as the default? It will be used in Amplify Map API calls if no explicit reference is provided.`;
const defaultGeofenceCollectionQuestion = `Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.`;

export function getGeoJSONFilePath(fileName: string): string {
  return path.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'geo-json-files', fileName);
}

/**
 * Add map with default values. Assume auth is already configured
 * @param cwd command directory
 */
export function addMapWithDefault(cwd: string, settings: GeoConfig = {}): Promise<void> {
  const config = { ...defaultGeoConfig, ...settings };
  const chain = spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
    .wait('Select which capability you want to add:')
    .sendCarriageReturn()
    .wait('Provide a name for the Map:')
    .sendLine(config.resourceName)
    .wait('Who can access this Map?')
    .sendCarriageReturn();

  chain.wait('Do you want to configure advanced settings?').sendNo();

  if (config.isAdditional === true) {
    chain.wait(defaultMapQuestion);
    if (config.isDefault === true) {
      chain.sendYes();
    } else {
      chain.sendNo();
    }
  }
  return chain.runAsync();
}

/**
 * Add place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
export function addPlaceIndexWithDefault(cwd: string, settings: GeoConfig = {}): Promise<void> {
  const config = { ...defaultGeoConfig, ...settings };
  const chain = spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
    .wait('Select which capability you want to add:')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Provide a name for the location search index (place index):')
    .sendLine(config.resourceName)
    .wait('Who can access this Search Index?')
    .sendCarriageReturn();

  chain.wait('Do you want to configure advanced settings?').sendNo();
  if (config.isAdditional === true) {
    chain.wait(defaultSearchIndexQuestion);
    if (config.isDefault === true) {
      chain.sendYes();
    } else {
      chain.sendNo();
    }
  }
  return chain.runAsync();
}

/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
 export function addGeofenceCollectionWithDefault(cwd: string, groupNames: string[], settings: GeoConfig = {}): Promise<void> {
  const config = { ...defaultGeoConfig, ...settings };
  const chain = spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
    .wait('Select which capability you want to add:')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('Provide a name for the Geofence Collection:')
    .sendLine(config.resourceName)
    .wait('Select one or more cognito groups to give access:')
    .sendCtrlA()
    .sendCarriageReturn();
  
  for (const groupName of groupNames){
    chain.wait(`What kind of access do you want for ${groupName} users? Select ALL that apply:`)
      .sendCtrlA()
      .sendCarriageReturn();
  }

  if (config.isAdditional === true) {
    chain.wait(defaultGeofenceCollectionQuestion);
    if (config.isDefault === true) {
      chain.sendYes();
    } else {
      chain.sendNo();
    }
  }
  return chain.runAsync();
}

/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
 export function populateGeofencesWithDefault(cwd: string, settings: GeoConfig = {}): Promise<void> {
  const config = { ...defaultGeoConfig, ...settings };
  const chain = spawn(getCLIPath(), ['geo', 'populate'], { cwd, stripColors: true })
    .wait('Provide the path to GeoJSON file containing the Geofences')
    .sendLine(getGeoJSONFilePath(config.geoJSONFileName))
    .wait('Do you have an identifier field in the Geofence(Feature) properties?');
  if (config.isRootLevelID) {
    chain.sendCarriageReturn(); //root level ID
  } else {
    chain
    .sendKeyDown()
    .sendCarriageReturn() //custom property
    .wait('Provide the name of the property to use as a unique geofence identifier')
    .sendLine(config.customProperty)
  }
  return chain.runAsync();
}

/**
 * Update an existing map with given settings. Assume auth is already configured
 * @param cwd command directory
 */
export function updateMapWithDefault(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
    .wait('Select which capability you want to update:')
    .sendCarriageReturn()
    .wait('Select the Map you want to update')
    .sendCarriageReturn()
    .wait('Who can access this Map?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait(defaultMapQuestion)
    .sendYes()
    .runAsync()
}

/**
 * Update the second map as default. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
export function updateSecondMapAsDefault(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
    .wait('Select which capability you want to update:')
    .sendCarriageReturn()
    .wait('Select the Map you want to update')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Who can access this Map?')
    .sendCarriageReturn()
    .wait(defaultMapQuestion)
    .sendYes()
    .runAsync()
}

/**
 * Update an existing place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
export function updatePlaceIndexWithDefault(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
    .wait('Select which capability you want to update:')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Select the search index you want to update')
    .sendCarriageReturn()
    .wait('Who can access this Search Index?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait(defaultSearchIndexQuestion)
    .sendYes()
    .runAsync()
}

/**
 * Update the second place index as default. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
export function updateSecondPlaceIndexAsDefault(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
    .wait('Select which capability you want to update:')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Select the search index you want to update')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Who can access this Search Index?')
    .sendCarriageReturn()
    .wait(defaultSearchIndexQuestion)
    .sendYes()
    .runAsync()
}

/**
 * Update an existing geofence collection with given settings. Assume auth is already configured
 * @param cwd command directory
 */
 export function updateGeofenceCollectionWithDefault(cwd: string, groupNames: string[]): Promise<void> {
  const chain = spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
    .wait('Select which capability you want to update:')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('Select the geofence collection you want to update')
    .sendCarriageReturn()
    .wait('Select one or more cognito groups to give access:')
    .sendCarriageReturn();

  for (const groupName of groupNames){
    chain.wait(`What kind of access do you want for ${groupName} users? Select ALL that apply:`)
      .sendCarriageReturn();
  }

  return chain.wait(defaultGeofenceCollectionQuestion)
    .sendYes()
    .runAsync();
}

/**
 * Update the second geofence collection as default. Assume auth is already configured and two geofence collections added with first default
 * @param cwd command directory
 */
export function updateSecondGeofenceCollectionAsDefault(cwd: string, groupNames: string[]): Promise<void> {
  const chain = spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
    .wait('Select which capability you want to update:')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('Select the geofence collection you want to update')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Select one or more cognito groups to give access:')
    .sendCarriageReturn();

    for (const groupName of groupNames){
      chain.wait(`What kind of access do you want for ${groupName} users? Select ALL that apply:`)
        .sendCarriageReturn();
    }
    return chain.wait(defaultGeofenceCollectionQuestion)
    .sendYes()
    .runAsync();
}

/**
 * Remove an existing map. Assume auth is already configured
 * @param cwd command directory
 */
export function removeMap(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
    .wait('Select which capability you want to remove:')
    .sendCarriageReturn()
    .wait('Select the Map you want to remove')
    .sendCarriageReturn()
    .wait('Are you sure you want to delete the resource?')
    .sendYes()
    .runAsync()
}

/**
 * Remove an existing default map. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
export function removeFirstDefaultMap(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
    .wait('Select which capability you want to remove:')
    .sendCarriageReturn()
    .wait('Select the Map you want to remove')
    .sendCarriageReturn()
    .wait('Are you sure you want to delete the resource?')
    .sendYes()
    .wait('Select the Map you want to set as default:')
    .sendCarriageReturn()
    .runAsync()
}

/**
 * Remove an existing place index. Assume auth is already configured
 * @param cwd command directory
 */
export function removePlaceIndex(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
    .wait('Select which capability you want to remove:')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Select the search index you want to remove')
    .sendCarriageReturn()
    .wait('Are you sure you want to delete the resource?')
    .sendYes()
    .runAsync()
}

/**
 * Remove an existing default index. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
export function removeFirstDefaultPlaceIndex(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
    .wait('Select which capability you want to remove:')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Select the search index you want to remove')
    .sendCarriageReturn()
    .wait('Are you sure you want to delete the resource?')
    .sendYes()
    .wait('Select the search index you want to set as default:')
    .sendCarriageReturn()
    .runAsync()
}

/**
 * Remove an existing geofence collection. Assume auth is already configured
 * @param cwd command directory
 */
 export function removeGeofenceCollection(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
    .wait('Select which capability you want to remove:')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('Select the geofence collection you want to remove')
    .sendCarriageReturn()
    .wait('Are you sure you want to delete the resource?')
    .sendYes()
    .runAsync()
}

/**
 * Remove an existing default geofence collection. Assume auth is already configured and two geofence collections added with first default
 * @param cwd command directory
 */
export function removeFirstDefaultGeofenceCollection(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
    .wait('Select which capability you want to remove:')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('Select the geofence collection you want to remove')
    .sendCarriageReturn()
    .wait('Are you sure you want to delete the resource?')
    .sendYes()
    .wait('Select the geofence collection you want to set as default:')
    .sendCarriageReturn()
    .runAsync()
}


/**
 * Get Geo configuration from aws-exports
 */
export function getGeoJSConfiguration(awsExports: any): any {
  return awsExports.geo.amazon_location_service;
}

export function generateResourceIdsInOrder(count: number): string[] {
  const resourceIdArr: string[] = [];
  while (count > 0) {
    resourceIdArr.push(generateRandomShortId());
    count--;
  }
  return resourceIdArr;
}
