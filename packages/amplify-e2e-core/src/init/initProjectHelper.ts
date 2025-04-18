/* eslint-disable import/no-cycle */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
import { EOL } from 'os';
import { v4 as uuid } from 'uuid';
import { nspawn as spawn, getCLIPath, singleSelect, addCircleCITags } from '..';
import { KEY_DOWN_ARROW } from '../utils';
import { amplifyRegions } from '../configure';

const defaultSettings = {
  name: EOL,
  // eslint-disable-next-line spellcheck/spell-checker
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
  disableCIDetection: false,
  providerConfig: undefined,
  permissionsBoundaryArn: undefined,
  includeUsageDataPrompt: true,
  includeGen2RecommendationPrompt: true,
  testingWithLatestCodebase: false,
};

export function initJSProjectWithProfile(cwd: string, settings?: Partial<typeof defaultSettings>): Promise<void> {
  const s = { ...defaultSettings, ...settings };
  let env;

  if (s.disableAmplifyAppCreation === true) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  addCircleCITags(cwd);

  const cliArgs = ['init'];
  const providerConfigSpecified = !!s.providerConfig && typeof s.providerConfig === 'object';
  if (providerConfigSpecified) {
    cliArgs.push('--providers', JSON.stringify(s.providerConfig));
  }

  if (s.permissionsBoundaryArn) {
    cliArgs.push('--permissions-boundary', s.permissionsBoundaryArn);
  }

  if (s?.name?.length > 20) console.warn('Project names should not be longer than 20 characters. This may cause tests to break.');

  const chain = spawn(getCLIPath(s.testingWithLatestCodebase), cliArgs, {
    cwd,
    stripColors: true,
    env,
    disableCIDetection: s.disableCIDetection,
  });

  chain.wait('Do you want to continue with Amplify Gen 1?').sendYes().wait('Why would you like to use Amplify Gen 1?').sendCarriageReturn();

  chain
    .wait('Enter a name for the project')
    .sendLine(s.name)
    .wait('Initialize the project with the above configuration?')
    .sendConfirmNo()
    .wait('Enter a name for the environment')
    .sendLine(s.envName)
    .wait('Choose your default editor:')
    .sendLine(s.editor)
    .wait("Choose the type of app that you're building")
    .sendCarriageReturn()
    .wait('What javascript framework are you using')
    .sendLine(s.framework)
    .wait('Source Directory Path:')
    .sendLine(s.srcDir)
    .wait('Distribution Directory Path:')
    .sendLine(s.distDir)
    .wait('Build Command:')
    .sendLine(s.buildCmd)
    .wait('Start Command:')
    .sendCarriageReturn();

  if (!providerConfigSpecified) {
    chain
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName);
  }

  if (s.includeUsageDataPrompt) {
    chain.wait(/Help improve Amplify CLI by sharing non( |-)sensitive( | project )configurations on failures/).sendYes();
  }
  return chain.wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/).runAsync();
}

export function initAndroidProjectWithProfile(cwd: string, settings: Partial<typeof defaultSettings>): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  addCircleCITags(cwd);

  let env;

  if (s.disableAmplifyAppCreation) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env,
    })
      .wait('Do you want to continue with Amplify Gen 1?')
      .sendYes()
      .wait('Why would you like to use Amplify Gen 1?')
      .sendCarriageReturn()
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendLine('android')
      .wait('Where is your Res directory')
      .sendCarriageReturn()
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
      .wait('Help improve Amplify CLI by sharing non-sensitive project configurations on failures')
      .sendYes()
      .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
      .run((err: Error) => {
        if (!err) {
          addCircleCITags(cwd);

          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function createRandomName(): string {
  const length = 20;
  const regExp = new RegExp('-', 'g');
  return uuid().replace(regExp, '').substring(0, length);
}

export function initIosProjectWithProfile(cwd: string, settings: Record<string, unknown>): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  addCircleCITags(cwd);

  let env;

  if (s.disableAmplifyAppCreation === true) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env,
    })
      .wait('Do you want to continue with Amplify Gen 1?')
      .sendYes()
      .wait('Why would you like to use Amplify Gen 1?')
      .sendCarriageReturn()
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendLine('ios')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
      .wait('Help improve Amplify CLI by sharing non-sensitive project configurations on failures')
      .sendYes()
      .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
      .run((err: Error) => {
        if (!err) {
          addCircleCITags(cwd);

          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function initIosProjectWithXcode(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['init'], {
    cwd,
    stripColors: true,
  })
    .wait('Do you want to continue with Amplify Gen 1?')
    .sendYes()
    .wait('Why would you like to use Amplify Gen 1?')
    .sendCarriageReturn()
    .wait('Enter a name for the project')
    .sendCarriageReturn()
    .wait('Initialize the project with the above configuration?')
    .sendConfirmNo()
    .wait('Enter a name for the environment')
    .sendLine(defaultSettings.envName)
    .wait('Choose your default editor:')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait("Choose the type of app that you're building")
    .sendLine('ios')
    .wait('Select the authentication method you want to use:')
    .sendCarriageReturn()
    .wait('Please choose the profile you want to use')
    .sendLine(defaultSettings.profileName)
    .wait(/Help improve Amplify CLI by sharing non( |-)sensitive( | project )configurations on failures/)
    .sendYes()
    .wait('Updating Xcode project:')
    .wait('Amplify project found.')
    .wait('Amplify config files found.')
    .wait('Successfully updated project')
    .wait('Amplify setup completed successfully.')
    .runAsync();
}

export function initFlutterProjectWithProfile(cwd: string, settings: Record<string, unknown>): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
      .wait('Do you want to continue with Amplify Gen 1?')
      .sendYes()
      .wait('Why would you like to use Amplify Gen 1?')
      .sendCarriageReturn()
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendLine('flutter')
      .wait('Where do you want to store your configuration file')
      .sendLine('./lib/')
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName);

    singleSelect(chain, s.region, amplifyRegions);
    chain
      .wait('Help improve Amplify CLI by sharing non-sensitive project configurations on failures')
      .sendYes()
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

export function initProjectWithAccessKey(
  cwd: string,
  settings: { accessKeyId: string; secretAccessKey: string; region?: string },
): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Do you want to continue with Amplify Gen 1?')
      .sendYes()
      .wait('Why would you like to use Amplify Gen 1?')
      .sendCarriageReturn()
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendLine('javascript')
      .wait('What javascript framework are you using')
      .sendLine(s.framework)
      .wait('Source Directory Path:')
      .sendLine(s.srcDir)
      .wait('Distribution Directory Path:')
      .sendLine(s.distDir)
      .wait('Build Command:')
      .sendLine(s.buildCmd)
      .wait('Start Command:')
      .sendCarriageReturn()
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .pauseRecording()
      .wait('accessKeyId')
      .sendLine(s.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(s.secretAccessKey)
      .resumeRecording()
      .wait('region');

    singleSelect(chain, s.region, amplifyRegions);
    chain
      .wait('Help improve Amplify CLI by sharing non-sensitive project configurations on failures')
      .sendYes()
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

export function initNewEnvWithAccessKey(cwd: string, s: { envName: string; accessKeyId: string; secretAccessKey: string }): Promise<void> {
  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Do you want to use an existing environment?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .pauseRecording()
      .wait('accessKeyId')
      .sendLine(s.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(s.secretAccessKey)
      .resumeRecording()
      .wait('region');

    singleSelect(chain, process.env.CLI_REGION, amplifyRegions);
    chain.wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function initNewEnvWithProfile(cwd: string, s: { envName: string }): Promise<void> {
  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Do you want to use an existing environment?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn()
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

export function updatedInitNewEnvWithProfile(cwd: string, s: { envName: string }): Promise<void> {
  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
    })
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendCarriageReturn()
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn()
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

export function amplifyInitSandbox(cwd: string, settings: Record<string, unknown>): Promise<void> {
  const s = { ...defaultSettings, ...settings };
  let env;

  if (s.disableAmplifyAppCreation === true) {
    env = {
      CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
    };
  }

  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], { cwd, stripColors: true, env })
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
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

export function amplifyVersion(cwd: string, expectedVersion: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['--version'], { cwd, stripColors: true })
      .wait(expectedVersion)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

// Can be called only if detects team-provider-info change
export function amplifyStatusWithMigrate(cwd: string, expectedStatus: string, testingWithLatestCodebase): Promise<void> {
  return new Promise((resolve, reject) => {
    const regex = new RegExp(`.*${expectedStatus}*`);
    spawn(getCLIPath(testingWithLatestCodebase), ['status'], { cwd, stripColors: true })
      .wait('Amplify has been upgraded to handle secrets more securely by migrating some values')
      .sendConfirmYes()
      .wait(regex)
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyStatus(cwd: string, expectedStatus: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const regex = new RegExp(`.*${expectedStatus}*`);
    spawn(getCLIPath(testingWithLatestCodebase), ['status'], { cwd, stripColors: true })
      .wait(regex)
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function initHeadless(cwd: string, envName?: string, appId?: string): Promise<void> {
  const cliArgs = ['init', '--yes'];

  if (envName) {
    cliArgs.push('--envName', envName);
  }

  if (appId) {
    cliArgs.push('--appId', appId);
  }

  return spawn(getCLIPath(), cliArgs, { cwd, stripColors: true }).runAsync();
}
