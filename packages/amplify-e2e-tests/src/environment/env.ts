/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable jsdoc/require-jsdoc */
import {
  nspawn as spawn, getCLIPath, getSocialProviders, isCI,
} from '@aws-amplify/amplify-e2e-core';

export function addEnvironment(cwd: string, settings: { envName: string; numLayers?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true })
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
      .run((err: Error) => (err ? reject(err) : resolve()));
  });
}

export function addEnvironmentYes(cwd: string, settings: { envName: string; disableAmplifyAppCreation?: boolean }): Promise<void> {
  // eslint-disable-next-line no-param-reassign
  settings.disableAmplifyAppCreation = settings.disableAmplifyAppCreation ?? true;
  const env = settings.disableAmplifyAppCreation
    ? {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    }
    : undefined;

  const providerConfig = {
    awscloudformation: {
      configLevel: 'project',
      useProfile: true,
      // eslint-disable-next-line spellcheck/spell-checker
      profileName: isCI() ? 'amplify-integ-test-user' : 'default',
    },
  };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add', '--yes', '--envName', settings.envName, '--providers', JSON.stringify(providerConfig)], {
      cwd,
      stripColors: true,
      env,
    }).run((err: Error) => (err ? reject(err) : resolve()));
  });
}

export function addEnvironmentWithImportedAuth(cwd: string, settings: { envName: string; currentEnvName: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true })
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

export function checkoutEnvironment(cwd: string, settings: { envName: string, restoreBackend?: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'checkout', settings.envName, settings.restoreBackend ? '--restore' : ''], { cwd, stripColors: true })
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
export const listEnvironment = async (cwd: string, settings: { numEnv?: number }): Promise<void> => {
  const numEnv = settings.numEnv || 1;
  const chain = spawn(getCLIPath(), ['env', 'list'], { cwd, stripColors: true }).wait('Environments:');

  for (let i = 0; i < numEnv; ++i) {
    chain.wait(/.+/); // any output but expect the correct number of lines
  }

  return chain.sendEof().runAsync();
};

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
  const {
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET,
    GOOGLE_APP_ID,
    GOOGLE_APP_SECRET,
    AMAZON_APP_ID,
    AMAZON_APP_SECRET,
    APPLE_APP_ID,
    APPLE_TEAM_ID,
    APPLE_KEY_ID,
    APPLE_PRIVATE_KEY,
  } = getSocialProviders();
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add'], { cwd, stripColors: true })
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
      .wait('Enter your Services ID for your OAuth flow:')
      .sendLine(APPLE_APP_ID)
      .wait('Enter your Team ID for your OAuth flow:')
      .sendLine(APPLE_TEAM_ID)
      .wait('Enter your Key ID for your OAuth flow:')
      .sendLine(APPLE_KEY_ID)
      .wait('Enter your Private Key for your OAuth flow:')
      .sendLine(APPLE_PRIVATE_KEY)
      .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
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
  const cmdArray = [
    'env',
    'import',
    '--name',
    settings.envName,
    '--config',
    settings.providerConfig,
    '--awsInfo',
    JSON.stringify({
      configLevel: 'project',
      useProfile: true,
      // eslint-disable-next-line spellcheck/spell-checker
      profileName: isCI() ? 'amplify-integ-test-user' : 'default',
    }),
    '--yes', // If env with same name already exists, overwrite it
  ];

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), cmdArray, { cwd, stripColors: true })
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
      .sendConfirmYes()
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
