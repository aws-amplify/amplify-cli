import { nspawn as spawn, KEY_DOWN_ARROW } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';

export function addPinpoint(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'analytics'], { cwd, stripColors: true, verbose })
      .wait('Select an Analytics provider')
      .sendCarriageReturn()
      .wait('Provide your pinpoint resource name:')
      .sendLine(settings.wrongName)
      .wait('Resource name should be alphanumeric')
      .sendCarriageReturn()
      .send('\b')
      .sendLine(settings.rightName)
      .wait('Apps need authorization to send analytics events. Do you want to allow guests')
      .sendLine('n')
      .wait(`Successfully added resource ${settings.rightName} locally`)
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

export function addKinesis(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'analytics'], { cwd, stripColors: true, verbose })
      .wait('Select an Analytics provider')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Enter a Stream name')
      .sendLine(settings.wrongName)
      .wait('Name is invalid.')
      .sendCarriageReturn()
      .send('\b')
      .sendLine(settings.rightName)
      .wait('Enter number of shards')
      .sendCarriageReturn()
      .wait('Apps need authorization to send analytics events. Do you want to allow guests')
      .sendLine('n')
      .wait(`Successfully added resource ${settings.rightName} locally`)
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

export function removeAnalytics(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'analytics'], { cwd, stripColors: true, verbose })
      .wait('Choose the resource you would want to remove')
      .send('j')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource?')
      .send('y')
      .sendCarriageReturn()
      .wait('Successfully removed resource')
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
