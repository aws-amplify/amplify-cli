import { nspawn as spawn, getCLIPath, singleSelect, addCircleCITags } from '..';
import { KEY_DOWN_ARROW } from '../utils';
import { amplifyRegions } from '../configure';

const defaultSettings = {
  name: '\r',
  envName: 'integtest',
  editor: '\r',
  appType: '\r',
  framework: '\r',
  srcDir: '\r',
  distDir: '\r',
  buildCmd: '\r',
  startCmd: '\r',
  useProfile: '\r',
  profileName: '\r',
  region: process.env.CLI_REGION,
  local: false,
  disableAmplifyAppCreation: true,
  disableCIDetection: false,
  providerConfig: undefined,
  permissionsBoundaryArn: undefined,
};

export function initJSProjectWithProfile(cwd: string, settings: Object): Promise<void> {
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

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), cliArgs, { cwd, stripColors: true, env, disableCIDetection: s.disableCIDetection })
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendLine(s.appType)
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

    chain.wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything').run((err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function initAndroidProjectWithProfile(cwd: string, settings: Object): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .send('j')
      .sendCarriageReturn()
      .wait('Where is your Res directory')
      .sendCarriageReturn()
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
      .wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
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

export function initIosProjectWithProfile(cwd: string, settings: Object): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendKeyDown(3)
      .sendCarriageReturn()
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
      .wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
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

export function initFlutterProjectWithProfile(cwd: string, settings: Object): Promise<void> {
  const s = { ...defaultSettings, ...settings };

  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Where do you want to store your configuration file')
      .sendLine('./lib/')
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName);

    singleSelect(chain, s.region, amplifyRegions);

    chain.wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything').run((err: Error) => {
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
    let chain = spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Initialize the project with the above configuration?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendLine(s.appType)
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

    chain.wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything').run((err: Error) => {
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
    let chain = spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
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

    chain.wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything').run((err: Error) => {
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
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Using default provider  awscloudformation')
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendCarriageReturn()
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

export function amplifyInitSandbox(cwd: string, settings: {}): Promise<void> {
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

export function amplifyInitYes(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init', '--yes'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    }).run((err: Error) => (err ? reject(err) : resolve()));
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

//Can be called only if detects teamprovider change
export function amplifyStatusWithMigrate(cwd: string, expectedStatus: string, testingWithLatestCodebase): Promise<void> {
  return new Promise((resolve, reject) => {
    let regex = new RegExp(`.*${expectedStatus}*`);
    spawn(getCLIPath(testingWithLatestCodebase), ['status'], { cwd, stripColors: true })
      .wait('Amplify has been upgraded to handle secrets more securely by migrating some values')
      .sendConfirmYes()
      .wait(regex)
      .sendLine('\r')
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
    let regex = new RegExp(`.*${expectedStatus}*`);
    spawn(getCLIPath(testingWithLatestCodebase), ['status'], { cwd, stripColors: true })
      .wait(regex)
      .sendLine('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
