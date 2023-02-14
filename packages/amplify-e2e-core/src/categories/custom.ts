import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath } from '..';

export const addCDKCustomResource = async (cwd: string, settings: any): Promise<void> => {
  await spawn(getCLIPath(), ['add', 'custom'], { cwd, stripColors: true })
    .wait('How do you want to define this custom resource?')
    .sendCarriageReturn()
    .wait('Provide a name for your custom resource')
    .sendLine(settings.name || '\r')
    .wait('Do you want to edit the CDK stack now?')
    .sendNo()
    .sendEof()
    .runAsync();
};

export const addCFNCustomResource = async (cwd: string, settings: any): Promise<void> => {
  await spawn(getCLIPath(), ['add', 'custom'], { cwd, stripColors: true })
    .wait('How do you want to define this custom resource?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Provide a name for your custom resource')
    .sendLine(settings.name || '\r')
    .wait('Do you want to access Amplify generated resources in your custom CloudFormation file?')
    .sendYes()
    .wait('Do you want to edit the CloudFormation stack now?')
    .sendNo()
    .sendEof()
    .runAsync();
};

export function buildCustomResources(cwd: string) {
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
