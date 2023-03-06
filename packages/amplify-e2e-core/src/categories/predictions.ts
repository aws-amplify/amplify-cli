import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath } from '..';

// add convert resource
export function addConvert(cwd: string): Promise<void> {
  const resourceName = 'convertTest1';
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['predictions', 'add'], { cwd, stripColors: true })
      .wait('Please select from one of the categories below')
      .send(KEY_DOWN_ARROW)
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
      .send(KEY_DOWN_ARROW)
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
export const addIdentifyCollection = async (cwd: string): Promise<void> => {
  const resourceName = 'identifyCollectionTest1';
  return spawn(getCLIPath(), ['predictions', 'add'], { cwd, stripColors: true })
    .wait('Please select from one of the categories below')
    .sendCarriageReturn()
    .wait('What would you like to identify?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Provide a friendly name for your resource')
    .sendLine(`${resourceName}\r`)
    .wait('Would you like to use the default configuration?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('Would you like to enable celebrity detection?')
    .sendYes()
    .wait('Would you like to identify entities from a collection of images?')
    .sendYes()
    .wait('How many entities would you like to identify?')
    .sendCarriageReturn()
    .wait('Would you like to allow users to add images to this collection?')
    .sendCarriageReturn()
    .wait('Who should have access?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('The CLI would be provisioning an S3 bucket')
    .sendCarriageReturn()
    .sendEof()
    .runAsync();
};

// add interpret resource
export function addInterpret(cwd: string): Promise<void> {
  const resourceName = 'interpretTest1';
  return spawn(getCLIPath(), ['add', 'predictions'], { cwd, stripColors: true })
    .wait('Please select from one of the categories below')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('Provide a friendly name for your resource')
    .sendLine(`${resourceName}\r`)
    .wait('What kind of interpretation would you like?')
    .sendLine('All')
    .wait('Who should have access?')
    .sendKeyDown()
    .sendCarriageReturn()
    .runAsync();
}
