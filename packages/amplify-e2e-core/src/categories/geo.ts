import { getCLIPath, nspawn as spawn, KEY_DOWN_ARROW } from '..';

/**
 * Add map with default values. Assume auth is already configured
 * @param cwd command directory
 */
export function addMapWithDefault(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['geo', 'add'], { cwd, stripColors: true })
      .wait('Select which capability you want to add:')
      .sendCarriageReturn()
      .wait('Provide a name for the Map:')
      .sendCarriageReturn()
      .wait('Who can access this Map?')
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