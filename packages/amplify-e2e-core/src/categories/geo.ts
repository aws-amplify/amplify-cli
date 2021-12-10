import { getCLIPath, nspawn as spawn, KEY_DOWN_ARROW, generateRandomShortId } from '..';
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
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .sendCarriageReturn()
      .wait('Provide a name for the Map:')
      .sendLine(config.resourceName)
      .wait('Who can access this Map?')
      .sendCarriageReturn();

    if (config.isFirstGeoResource === true) {
      chain.wait('Are you tracking commercial assets for your business in your app?').sendCarriageReturn();
      chain.wait('Successfully set RequestBasedUsage pricing plan for your Geo resources.');
    }

    chain.wait('Do you want to configure advanced settings?').sendConfirmNo();

    if (config.isAdditional === true) {
      chain.wait(defaultMapQuestion);
      if (config.isDefault === true) {
        chain.sendConfirmYes();
      } else {
        chain.sendConfirmNo();
      }
    }
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

/**
 * Add place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
export function addPlaceIndexWithDefault(cwd: string, settings: GeoConfig = {}): Promise<void> {
  const config = { ...defaultGeoConfig, ...settings };
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a name for the location search index (place index):')
      .sendLine(config.resourceName)
      .wait('Who can access this Search Index?')
      .sendCarriageReturn();

    if (config.isFirstGeoResource === true) {
      chain.wait('Are you tracking commercial assets for your business in your app?').sendConfirmNo();
      chain.wait('Successfully set RequestBasedUsage pricing plan for your Geo resources.');
    }

    chain.wait('Do you want to configure advanced settings?').sendConfirmNo();
    if (config.isAdditional === true) {
      chain.wait(defaultSearchIndexQuestion);
      if (config.isDefault === true) {
        chain.sendConfirmYes();
      } else {
        chain.sendConfirmNo();
      }
    }
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
 export function addGeofenceCollectionWithDefault(cwd: string, settings: GeoConfig = {}): Promise<void> {
  const config = { ...defaultGeoConfig, ...settings };
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Provide a name for the Geofence Collection:')
      .sendLine(config.resourceName)
      .wait('What kind of access do you want')
      .sendCtrlA()
      .sendCarriageReturn()
      .wait('Are you tracking or directing commercial assets for your business in your app?')
      .sendCarriageReturn();

    if (config.isAdditional === true) {
      chain.wait(defaultGeofenceCollectionQuestion);
      if (config.isDefault === true) {
        chain.sendConfirmYes();
      } else {
        chain.sendConfirmNo();
      }
    }
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
 export function populateGeofencesWithDefault(cwd: string, settings: GeoConfig = {}): Promise<void> {
  const config = { ...defaultGeoConfig, ...settings };
  return new Promise((resolve, reject) => {
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
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Update an existing map with given settings. Assume auth is already configured
 * @param cwd command directory
 */
export function updateMapWithDefault(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
      .wait('Select which capability you want to update:')
      .sendCarriageReturn()
      .wait('Select the Map you want to update')
      .sendCarriageReturn()
      .wait('Who can access this Map?')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait(defaultMapQuestion)
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * Update the second map as default. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
export function updateSecondMapAsDefault(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
      .wait('Select which capability you want to update:')
      .sendCarriageReturn()
      .wait('Select the Map you want to update')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Who can access this Map?')
      .sendCarriageReturn()
      .wait(defaultMapQuestion)
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * Update an existing place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
export function updatePlaceIndexWithDefault(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
      .wait('Select which capability you want to update:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the search index you want to update')
      .sendCarriageReturn()
      .wait('Who can access this Search Index?')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait(defaultSearchIndexQuestion)
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * Update the second place index as default. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
export function updateSecondPlaceIndexAsDefault(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'update'], { cwd, stripColors: true })
      .wait('Select which capability you want to update:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the search index you want to update')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Who can access this Search Index?')
      .sendCarriageReturn()
      .wait(defaultSearchIndexQuestion)
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * Remove an existing map. Assume auth is already configured
 * @param cwd command directory
 */
export function removeMap(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
      .wait('Select which capability you want to remove:')
      .sendCarriageReturn()
      .wait('Select the Map you want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * Remove an existing default map. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
export function removeFirstDefaultMap(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
      .wait('Select which capability you want to remove:')
      .sendCarriageReturn()
      .wait('Select the Map you want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .sendConfirmYes()
      .wait('Select the Map you want to set as default:')
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * Remove an existing place index. Assume auth is already configured
 * @param cwd command directory
 */
export function removePlaceIndex(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
      .wait('Select which capability you want to remove:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the search index you want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
}

/**
 * Remove an existing default index. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
export function removeFirstDefaultPlaceIndex(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'remove'], { cwd, stripColors: true })
      .wait('Select which capability you want to remove:')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the search index you want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .sendConfirmYes()
      .wait('Select the search index you want to set as default:')
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      });
  });
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
