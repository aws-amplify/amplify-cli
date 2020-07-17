import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath } from '../../src';

// add convert resource
export function addConvert(cwd: string, settings: any) {
  const resourceName = 'convertTest1';
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['predictions', 'add'], { cwd, stripColors: true })
      .wait('Please select from one of the categories below')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('What would you like to convert?')
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource')
      .sendLine(`${resourceName}\r`)
      .wait('What is the source language?')
      .sendCarriageReturn()
      .wait('What is the target language?')
      .sendCarriageReturn()
      .wait('Who should have access?')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

// add identify test
export function addIdentifyCollection(cwd: string, settings: any) {
  const resourceName = 'identifyCollectionTest1';
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['predictions', 'add'], { cwd, stripColors: true })
      .wait('Please select from one of the categories below')
      .sendCarriageReturn()
      .wait('What would you like to identify?')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource')
      .sendLine(`${resourceName}\r`)
      .wait('Would you like use the default configuration?')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Would you like to enable celebrity detection?')
      .sendLine('y')
      .wait('Would you like to identify entities from a collection of images?')
      .sendLine('y')
      .wait('How many entities would you like to identify?')
      .sendCarriageReturn()
      .wait('Would you like to allow users to add images to this collection?')
      .sendLine('y')
      .wait('Who should have access?')
      .sendLine(KEY_DOWN_ARROW)
      .wait('The CLI would be provisioning an S3 bucket')
      .sendCarriageReturn()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

// add interpret resource
export function addInterpret(cwd: string, settings: any) {
  const resourceName = 'interpretTest1';
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'predictions'], { cwd, stripColors: true })
      .wait('Please select from one of the categories below')
      .sendLine(`${KEY_DOWN_ARROW}${KEY_DOWN_ARROW}`)
      .wait('What would you like to interpret?')
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource')
      .sendLine(`${resourceName}\r`)
      .wait('What kind of interpretation would you like?')
      .sendLine('k')
      .wait('Who should have access?')
      .sendLine(KEY_DOWN_ARROW)
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
