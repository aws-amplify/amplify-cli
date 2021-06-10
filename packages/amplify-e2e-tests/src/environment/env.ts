import { nspawn as spawn, getCLIPath, getSocialProviders } from 'amplify-e2e-core';

export function addEnvironment(cwd: string, settings: { envName: string; numLayers?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn();

    chain.wait('Initialized your environment successfully.').run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function updateEnvironment(cwd: string, settings: { permissionsBoundaryArn: string }) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'update'], { cwd, stripColors: true })
      .wait('Specify an IAM Policy ARN to use as a permissions boundary for all Amplify-generated IAM Roles')
      .sendLine(settings.permissionsBoundaryArn)
      .run((err: Error) => (!!err ? reject(err) : resolve()));
  });
}

export function addEnvironmentYes(cwd: string, settings: { envName: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add', '--yes', '--envName', settings.envName], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    }).run((err: Error) => (err ? reject(err) : resolve()));
  });
}

export function addEnvironmentWithImportedAuth(cwd: string, settings: { envName: string; currentEnvName: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true })
      .wait('Do you want to use an existing environment?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn()
      .wait(`already imported to '${settings.currentEnvName}' environment, do you want to import it to the new environment`)
      .sendConfirmYes()
      .wait('Initialized your environment successfully.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function checkoutEnvironment(cwd: string, settings: { envName: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'checkout', settings.envName], { cwd, stripColors: true })
      .wait('Initialized your environment successfully.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

// Test multiple Environments by passing settings.numEnv
export function listEnvironment(cwd: string, settings: { numEnv?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    let numEnv = settings.numEnv || 1;
    let regex = /\|\s\*?[a-z]{2,10}\s+\|/;
    const chain = spawn(getCLIPath(), ['env', 'list'], { cwd, stripColors: true }).wait('| Environments |').wait('| ------------ |');

    for (let i = 0; i < numEnv; ++i) {
      chain.wait(regex);
    }

    chain.sendEof().run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

// Get environment details and return them as JSON
export function getEnvironment(cwd: string, settings: { envName: string }): Promise<string> {
  const envData = {};
  let helper = output => {
    let keyVal = output.split(/:(.+)/); // Split string on first ':' only
    envData[keyVal[0].trim()] = keyVal[1].trim();
  };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'get', '--name', settings.envName], { cwd, stripColors: true })
      .wait(settings.envName)
      .wait('--------------')
      .wait('Provider')
      .wait('AuthRoleName', helper)
      .wait('UnauthRoleArn', helper)
      .wait('Region', helper)
      .wait('DeploymentBucketName', helper)
      .wait('UnauthRoleName', helper)
      .wait('StackName', helper)
      .wait('StackId', helper)
      .wait('--------------')
      .sendEof()
      .run((err: Error) => {
        let jsonEnvData = JSON.stringify({ awscloudformation: envData });
        if (!err) {
          resolve(jsonEnvData);
          return jsonEnvData;
        } else {
          reject(err);
        }
      });
  });
}

/*
  `amplify env pull` only outputs via ora.spinner,
  but nexpect can't wait() on the spinner output
  See amplify-cli/src/initialize-env.js
*/
export function pullEnvironment(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'pull'], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function addEnvironmentHostedUI(cwd: string, settings: { envName: string }): Promise<void> {
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_APP_ID, GOOGLE_APP_SECRET, AMAZON_APP_ID, AMAZON_APP_SECRET } = getSocialProviders();
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn()
      .wait('Enter your Facebook App ID for your OAuth flow:')
      .sendLine(FACEBOOK_APP_ID)
      .wait('Enter your Facebook App Secret for your OAuth flow:')
      .sendLine(FACEBOOK_APP_SECRET)
      .wait('Enter your Google Web Client ID for your OAuth flow:')
      .sendLine(GOOGLE_APP_ID)
      .wait('Enter your Google Web Client Secret for your OAuth flow:')
      .sendLine(GOOGLE_APP_SECRET)
      .wait('Enter your Amazon App ID for your OAuth flow:')
      .sendLine(AMAZON_APP_ID)
      .wait('Enter your Amazon App Secret for your OAuth flow:')
      .sendLine(AMAZON_APP_SECRET)
      .wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function importEnvironment(cwd: string, settings: { envName: string; providerConfig: string }): Promise<void> {
  const cmd_array = [
    'env',
    'import',
    '--name',
    settings.envName,
    '--config',
    settings.providerConfig,
    '--yes', // If env with same name already exists, overwrite it
  ];

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), cmd_array, { cwd, stripColors: true })
      .wait('Successfully added environment from your project')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          console.error(err);
          reject(err);
        }
      });
  });
}

export function removeEnvironment(cwd: string, settings: { envName: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'remove', settings.envName], { cwd, stripColors: true })
      .wait(`Are you sure you want to continue?`)
      .sendLine('y')
      .wait('Successfully removed environment from your project locally')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
