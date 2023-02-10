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

export function addCFNCustomResource(cwd: string, settings: any, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'custom'], { cwd, stripColors: true })
      .wait('How do you want to define this custom resource?')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Provide a name for your custom resource')
      .sendLine(settings.name || '\r')
      .wait('Do you want to access Amplify generated resources in your custom CloudFormation file?')
      .sendConfirmYes();
      if(settings.promptForCategorySelection){
        chain.wait('Select the categories you want this custom resource to have access to.')
        .send(' ')
        .sendCarriageReturn()
      }
      chain.wait(/.*/)
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

export function buildCustomResources(cwd: string, usingLatestCodebase = false) {
  return new Promise((resolve, reject) => {
    const args = ['custom', 'build'];

    spawn(getCLIPath(usingLatestCodebase), args, { cwd, stripColors: true })
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
