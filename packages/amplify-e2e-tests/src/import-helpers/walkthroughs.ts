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

export const importIdentityPoolAndUserPool = (cwd: string, autoCompletePrefix: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['auth', 'import'], { cwd, stripColors: true })
      .wait('What type of auth resource do you want to import')
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

export const headlessPullExpectError = (
  projectRoot: string,
  amplifyParameters: Object,
  providersParameter: Object,
  errorMessage: string,
  categoriesParameter?: Object,
  frontendParameter?: Object,
): Promise<void> => {
  const pullCommand: string[] = [
    'pull',
    '--amplify',
    JSON.stringify(amplifyParameters),
    '--providers',
    JSON.stringify(providersParameter),
    '--no-override',
    '--yes',
  ];

  if (categoriesParameter) {
    pullCommand.push(...['--categories', JSON.stringify(categoriesParameter)]);
  }

  if (frontendParameter) {
    pullCommand.push('--frontend', JSON.stringify(frontendParameter));
  }

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), pullCommand, { cwd: projectRoot, stripColors: true })
      .wait(errorMessage)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
};

export const headlessPull = (
  projectRoot: string,
  amplifyParameters: Object,
  providersParameter: Object,
  categoriesParameter?: Object,
  frontendParameter?: Object,
): Promise<void> => {
  const pullCommand: string[] = [
    'pull',
    '--amplify',
    JSON.stringify(amplifyParameters),
    '--providers',
    JSON.stringify(providersParameter),
    '--no-override',
    '--yes',
  ];

  if (categoriesParameter) {
    pullCommand.push(...['--categories', JSON.stringify(categoriesParameter)]);
  }

  if (frontendParameter) {
    pullCommand.push('--frontend', JSON.stringify(frontendParameter));
  }

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), pullCommand, { cwd: projectRoot, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
};

export const importS3 = (cwd: string, autoCompletePrefix: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['storage', 'import'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Select the S3 Bucket you want to import')
      .send(autoCompletePrefix)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn()
      .wait('- JavaScript: https://docs.amplify.aws/lib/storage/getting-started/q/platform/js')
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

export const removeImportedS3WithDefault = (cwd: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['storage', 'remove'], { cwd, stripColors: true })
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

export const importDynamoDBTable = (cwd: string, autoCompletePrefix: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['storage', 'import'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the DynamoDB Table you want to import')
      .send(autoCompletePrefix)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn()
      .wait(`- This resource can now be accessed from REST APIs (‘amplify add api’) and Functions (‘amplify add function’)`)
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

// As of Today it is the same that we have for S3, duplicated to make sure we not break when updating the flow of only one
// of these.
export const removeImportedDynamoDBWithDefault = (cwd: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['storage', 'remove'], { cwd, stripColors: true })
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
