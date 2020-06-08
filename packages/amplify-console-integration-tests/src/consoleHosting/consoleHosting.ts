import { nspawn as spawn } from 'amplify-e2e-core';
import { getCLIPath } from '../util';
import { HOSTING_NOT_ENABLED, HOSTING_ENABLED_IN_CONSOLE, ORIGINAL_ENV } from './constants';

const defaultSettings = {
  name: '\r',
  envName: ORIGINAL_ENV,
  editor: '\r',
  appType: '\r',
  framework: '\r',
  srcDir: '\r',
  distDir: '\r',
  buildCmd: '\r',
  startCmd: '\r',
  useProfile: '\r',
  profileName: '\r',
};

export function initJSProjectWithProfile(cwd: string, providersParam: any) {
  const s = { ...defaultSettings };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init', '--providers', JSON.stringify(providersParam)], { cwd, stripColors: true })
      .wait('Enter a name for the project')
      .sendLine(s.name)
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

export function deleteProject(cwd: string, deleteDeploymentBucket: Boolean = true) {
  return new Promise((resolve, reject) => {
    const noOutputTimeout = 10 * 60 * 1000; // 10 minutes
    spawn(getCLIPath(), ['delete'], { cwd, stripColors: true, noOutputTimeout })
      .wait('Are you sure you want to continue?')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Project deleted locally.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addEnvironment(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add', '--providers', JSON.stringify(settings.providersParam)], { cwd, stripColors: true })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
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

export function addManualHosting(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Hosting with Amplify Console*/)
      .sendLine('\r')
      .wait('Manual deployment')
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

export function addCICDHostingWithoutFrontend(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Hosting with Amplify Console*/)
      .sendLine('\r')
      .wait('Continuous deployment (Git-based deployments)')
      //move up
      .send('k')
      .sendLine('\r')
      .wait(/.*Continuous deployment is configured in the Amplify Console.*/)
      .sendLine('\r')
      .wait("No hosting URL found. Run 'amplify add hosting' again to set up hosting with Amplify Console.")
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyPublish(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['publish'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue?')
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

export function amplifyConfigure(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['hosting', 'configure'], { cwd, stripColors: true })
      .wait(/.*We recommends you open AWS Amplify Console*/)
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

export function amplifyServe(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['hosting', 'configure'], { cwd, stripColors: true })
      .wait(/.*You have set up Manual deployment*/)
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

export function amplifyStatus(cwd: string, expectedStatus: string) {
  return new Promise((resolve, reject) => {
    let regex = new RegExp(`.*${expectedStatus}*`);
    spawn(getCLIPath(), ['status'], { cwd, stripColors: true })
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

export function amplifyPush(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue?')
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

export function removeHosting(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Are you sure you want to delete the resource*/)
      .sendLine('\r')
      .wait('Successfully removed resource')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function removeNonExistingHosting(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Hosting with Amplify Console*/)
      .sendCarriageReturn()
      .wait(HOSTING_NOT_ENABLED)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function removeHostingEnabledInConsole(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Hosting with Amplify Console*/)
      .sendCarriageReturn()
      .wait(HOSTING_ENABLED_IN_CONSOLE)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function checkoutEnv(cwd: string, env: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'checkout', env], { cwd, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
