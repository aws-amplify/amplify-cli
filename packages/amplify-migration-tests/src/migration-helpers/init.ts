import { addCICleanupTags, getCLIPath, nspawn as spawn } from '@aws-amplify/amplify-e2e-core';
import { EOL } from 'os';

const defaultSettings = {
  name: EOL,
  envName: 'integtest',
  editor: EOL,
  appType: EOL,
  framework: EOL,
  srcDir: EOL,
  distDir: EOL,
  buildCmd: EOL,
  startCmd: EOL,
  useProfile: EOL,
  profileName: EOL,
  region: process.env.CLI_REGION,
  local: false,
  disableAmplifyAppCreation: true,
};

export function initJSProjectWithProfileV4_28_2(
  cwd: string,
  settings: Record<string, unknown>,
  testingWithLatestCodebase = false,
): Promise<void> {
  const mergedSettings = { ...defaultSettings, ...settings };
  let env;

  if (mergedSettings.disableAmplifyAppCreation === true) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  addCICleanupTags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['init'], { cwd, stripColors: true, env })
      .wait('Enter a name for the project')
      .sendLine(mergedSettings.name)
      .wait('Enter a name for the environment')
      .sendLine(mergedSettings.envName)
      .wait('Choose your default editor:')
      .sendLine(mergedSettings.editor)
      .wait("Choose the type of app that you're building")
      .sendCarriageReturn()
      .wait('What javascript framework are you using')
      .sendLine(mergedSettings.framework)
      .wait('Source Directory Path:')
      .sendLine(mergedSettings.srcDir)
      .wait('Distribution Directory Path:')
      .sendLine(mergedSettings.distDir)
      .wait('Build Command:')
      .sendLine(mergedSettings.buildCmd)
      .wait('Start Command:')
      .sendCarriageReturn()
      .wait('Using default provider  awscloudformation')
      .wait(/(Select the authentication method you want to use|Do you want to use an AWS profile)/)
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(mergedSettings.profileName)
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

export function initJSProjectWithProfileV4_52_0(
  cwd: string,
  settings: Record<string, unknown>,
  testingWithLatestCodebase = false,
): Promise<void> {
  const mergedSettings = { ...defaultSettings, ...settings };
  let env;

  if (mergedSettings.disableAmplifyAppCreation === true) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  addCICleanupTags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['init'], { cwd, stripColors: true, env })
      .wait('Enter a name for the project')
      .sendLine(mergedSettings.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(mergedSettings.envName)
      .wait('Choose your default editor:')
      .sendLine(mergedSettings.editor)
      .wait("Choose the type of app that you're building")
      .sendCarriageReturn()
      .wait('What javascript framework are you using')
      .sendLine(mergedSettings.framework)
      .wait('Source Directory Path:')
      .sendLine(mergedSettings.srcDir)
      .wait('Distribution Directory Path:')
      .sendLine(mergedSettings.distDir)
      .wait('Build Command:')
      .sendLine(mergedSettings.buildCmd)
      .wait('Start Command:')
      .sendCarriageReturn()
      .wait('Using default provider  awscloudformation')
      .wait(/(Select the authentication method you want to use|Do you want to use an AWS profile)/)
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(mergedSettings.profileName)
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

export function initAndroidProjectWithProfile(cwd: string, settings: Record<string, unknown>): Promise<void> {
  const mergedSettings = { ...defaultSettings, ...settings };

  addCICleanupTags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Enter a name for the project')
      .sendLine(mergedSettings.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(mergedSettings.envName)
      .wait('Choose your default editor:')
      .sendLine(mergedSettings.editor)
      .wait("Choose the type of app that you're building")
      .sendLine('android')
      .wait('Where is your Res directory')
      .sendCarriageReturn()
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(mergedSettings.profileName)
      .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
      .run((err: Error) => {
        if (!err) {
          addCICleanupTags(cwd);

          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function initAndroidProjectWithProfileInquirer(cwd: string, settings: Record<string, unknown>): Promise<void> {
  const mergedSettings = { ...defaultSettings, ...settings };

  addCICleanupTags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Enter a name for the project')
      .sendLine(mergedSettings.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(mergedSettings.envName)
      .wait('Choose your default editor:')
      .sendLine(mergedSettings.editor)
      .wait("Choose the type of app that you're building")
      .send('j')
      .sendCarriageReturn()
      .wait('Where is your Res directory')
      .sendCarriageReturn()
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(mergedSettings.profileName)
      .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
      .run((err: Error) => {
        if (!err) {
          addCICleanupTags(cwd);

          resolve();
        } else {
          reject(err);
        }
      });
  });
}
