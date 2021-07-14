import { getCLIPath, nspawn as spawn, KEY_DOWN_ARROW } from '..';

export type GeoConfig = {
  isAdditional?: boolean
  isDefault?: boolean
  resourceName?: string
}

const defaultGeoConfig: GeoConfig = {
  isAdditional: false,
  isDefault: true,
  resourceName: '\r'
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
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
      .sendConfirmNo();
    if (config.isAdditional) {
      chain.wait('Do you want to set this map as default?')
      if (config.isDefault) {
        chain.sendConfirmYes()
      } else {
        chain.sendConfirmNo()
      }
    }
    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject();
      }
    })
  });
}

/**
 * Add place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
export function addPlaceIndexWithDefault(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Provide a name for the location search index (place index):')
      .sendCarriageReturn()
      .wait('Who can access this Search Index?')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
      .sendConfirmNo()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      })
  });
}

/**
 * Update an existing map with default values. Assume auth is already configured
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
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      })
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
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the search index you want to update')
      .sendCarriageReturn()
      .wait('Who can access this Search Index?')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      })
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
      })
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
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the PlaceIndex you want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject();
        }
      })
  });
}