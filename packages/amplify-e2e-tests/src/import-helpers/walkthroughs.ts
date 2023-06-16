import { getCLIPath, listUserPools, nspawn as spawn } from '@aws-amplify/amplify-e2e-core';

export const importUserPoolOnly = (cwd: string, autoCompletePrefix: string, clientNames?: { web?: string; native?: string }) => {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['auth', 'import'], { cwd, stripColors: true })
      .wait('What type of auth resource do you want to import')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the User Pool you want to import')
      .send(autoCompletePrefix)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn();

    if (clientNames?.web) {
      chain
        .wait('Select a Web client to import:')
        .send(clientNames.web)
        .delay(500) // Some delay required for autocomplete and terminal to catch up
        .sendCarriageReturn();
    }

    if (clientNames?.native) {
      chain.wait('Select a Native client to import:');
      chain
        .send(clientNames.native)
        .delay(500) // Some delay required for autocomplete and terminal to catch up
        .sendCarriageReturn();
    }

    chain
      .wait('- JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve(undefined);
        } else {
          reject(err);
        }
      });
  });
};

export const importSingleIdentityPoolAndUserPool = async (
  cwd: string,
  autoCompletePrefix: string,
  region: string,
  clientNames?: { web?: string; native?: string },
) => {
  const chain = spawn(getCLIPath(), ['auth', 'import'], { cwd, stripColors: true })
    .wait('What type of auth resource do you want to import')
    .sendCarriageReturn();

  const userpools = await listUserPools(region);

  if (userpools.length > 1) {
    chain.wait('Select the User Pool you want to import:').sendLine(autoCompletePrefix);
  } else {
    chain.wait('Only one Cognito User Pool');
  }

  chain.delay(500); // Some delay required for autocomplete and terminal to catch up

  if (clientNames?.web) {
    chain
      .wait('Select a Web client to import:')
      .send(clientNames.web)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn();
  }

  if (clientNames?.native) {
    chain.wait('Select a Native client to import:');
    chain
      .send(clientNames.native)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn();
  } else {
    chain.wait('Select a Native client to import:').sendCarriageReturn();
  }

  return chain.wait('- JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js').sendEof().runAsync();
};

export const importIdentityPoolAndUserPool = (cwd: string, autoCompletePrefix: string, clientNames?: { web?: string; native?: string }) => {
  const chain = spawn(getCLIPath(), ['auth', 'import'], { cwd, stripColors: true })
    .wait('What type of auth resource do you want to import')
    .sendCarriageReturn()
    .wait('Select the User Pool you want to import')
    .send(autoCompletePrefix)
    .delay(500) // Some delay required for autocomplete and terminal to catch up
    .sendCarriageReturn();

  if (clientNames?.web) {
    chain
      .wait('Select a Web client to import:')
      .send(clientNames.web)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn();
  }

  if (clientNames?.native) {
    chain.wait('Select a Native client to import:');
    chain
      .send(clientNames.native)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn();
  } else {
    chain.wait('Select a Native client to import:').sendCarriageReturn();
  }

  return chain.wait('- JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js').sendEof().runAsync();
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
          resolve(undefined);
        } else {
          reject(err);
        }
      });
  });
};

export const removeImportedAuthHeadless = async (cwd: string, authResourceName: string) => {
  const chain = spawn(getCLIPath(), ['auth', 'remove', authResourceName, '-y'], { cwd, stripColors: true });
  await chain.runAsync();
};

export const addS3WithAuthConfigurationMismatchErrorExit = (cwd: string) => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Provide a friendly name')
      .sendCarriageReturn()
      .wait('Provide bucket name')
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
          resolve(undefined);
        } else {
          reject(err);
        }
      });
  });
};

export const headlessPullExpectError = (
  projectRoot: string,
  amplifyParameters: Record<string, unknown>,
  providersParameter: Record<string, unknown>,
  errorMessage: string,
  categoriesParameter?: Record<string, unknown>,
  frontendParameter?: Record<string, unknown>,
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
  amplifyParameters: Record<string, unknown>,
  providersParameter: Record<string, unknown>,
  categoriesParameter?: Record<string, unknown>,
  frontendParameter?: Record<string, unknown>,
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

export const importS3 = (cwd: string, autoCompletePrefix: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['storage', 'import'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
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

export const removeImportedS3WithDefault = (cwd: string): Promise<void> => {
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

export const importDynamoDBTable = (cwd: string, autoCompletePrefix: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['storage', 'import'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Select the DynamoDB Table you want to import')
      .send(autoCompletePrefix)
      .delay(500) // Some delay required for autocomplete and terminal to catch up
      .sendCarriageReturn()
      .wait('- This resource can now be accessed from REST APIs (`amplify add api`) and Functions (`amplify add function`)')
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
export const removeImportedDynamoDBWithDefault = (cwd: string): Promise<void> => {
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
