import { nspawn as spawn, getCLIPath } from 'amplify-e2e-core';

export const importUserPoolOnly = (cwd: string, autoCompletePrefix: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['auth', 'import'], { cwd, stripColors: true })
      .wait('What type of auth resource do you want to import')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the User Pool you want to import')
      .send(autoCompletePrefix)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn()
      .wait('- JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

export const removeImportedAuthWithDefault = (cwd: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['auth', 'remove'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to unlink this imported resource')
      .sendConfirmYes()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

export const addS3WithAuthConfigurationMismatchErrorExit = (cwd: string, settings: any) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Please provide a friendly name')
      .sendCarriageReturn()
      .wait('Please provide bucket name')
      .sendCarriageReturn()
      .wait('Who should have access')
      .sendCarriageReturn()
      .wait('What kind of access do you want')
      .sendLine(' ')
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmNo()
      .wait('Current auth configuration is: userPoolOnly, but identityPoolAndUserPool was required.')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};
