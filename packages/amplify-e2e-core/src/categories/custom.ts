import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath } from '..';

export function addCDKCustomResource(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'custom'], { cwd, stripColors: true })
      .wait('How do you want to define this custom resource?')
      .sendCarriageReturn()
      .wait('Provide a name for your custom resource')
      .sendLine(settings.name || '\r')
      .wait('Do you want to edit the CDK stack now?')
      .sendConfirmNo()
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

export function addCFNCustomResource(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'custom'], { cwd, stripColors: true })
      .wait('How do you want to define this custom resource?')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Provide a name for your custom resource')
      .sendLine(settings.name || '\r')
      .wait('Do you want to access Amplify generated resources in your custom CloudFormation file?')
      .sendConfirmYes()
      .wait('Select the categories you want this custom resource to have access to.')
      .send(' ')
      .sendCarriageReturn()
      .wait(/.*/)
      .wait('Do you want to edit the CloudFormation stack now?')
      .sendConfirmNo()
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

export function buildCustomResources(cwd: string, settings: {}) {
  return new Promise((resolve, reject) => {
    const args = ['custom', 'build'];

    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}
