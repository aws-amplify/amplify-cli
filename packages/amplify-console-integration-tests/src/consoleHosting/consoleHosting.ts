import { addCircleCITags, nspawn as spawn } from 'amplify-e2e-core';
import { getCLIPath } from '../util';
import { HOSTING_NOT_ENABLED, HOSTING_ENABLED_IN_CONSOLE, ORIGINAL_ENV } from './constants';
import { EOL } from 'os';

const defaultSettings = {
  name: EOL,
  envName: ORIGINAL_ENV,
  editor: EOL,
  appType: EOL,
  framework: EOL,
  srcDir: EOL,
  distDir: EOL,
  buildCmd: EOL,
  startCmd: EOL,
  useProfile: EOL,
  profileName: EOL,
};

export function deleteProject(cwd: string, deleteDeploymentBucket: Boolean = true): Promise<void> {
  return new Promise((resolve, reject) => {
    const noOutputTimeout = 10 * 60 * 1000; // 10 minutes
    spawn(getCLIPath(), ['delete'], { cwd, stripColors: true, noOutputTimeout })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
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

export function addEnvironment(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add', '--providers', JSON.stringify(settings.providersParam)], { cwd, stripColors: true })
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

export function addManualHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Hosting with Amplify Console*/)
      .sendCarriageReturn()
      .wait('Manual deployment')
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

export function addCICDHostingWithoutFrontend(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Hosting with Amplify Console*/)
      .sendCarriageReturn()
      .wait('Continuous deployment (Git-based deployments)')
      //move up
      .send('k')
      .sendCarriageReturn()
      .wait(/.*Continuous deployment is configured in the Amplify Console.*/)
      .sendCarriageReturn()
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

export function amplifyPublish(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['publish'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue?')
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

export function amplifyConfigure(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['hosting', 'configure'], { cwd, stripColors: true })
      .wait(/.*We recommends you open AWS Amplify Console*/)
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

export function amplifyServe(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['hosting', 'configure'], { cwd, stripColors: true })
      .wait(/.*You have set up Manual deployment*/)
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

export function amplifyStatus(cwd: string, expectedStatus: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let regex = new RegExp(`.*${expectedStatus}*`);
    spawn(getCLIPath(), ['status'], { cwd, stripColors: true })
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

export function amplifyPush(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue?')
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

export function removeHosting(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true })
      .wait(/.*Are you sure you want to delete the resource*/)
      .sendCarriageReturn()
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

export function removeNonExistingHosting(cwd: string): Promise<void> {
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

export function removeHostingEnabledInConsole(cwd: string): Promise<void> {
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

export function checkoutEnv(cwd: string, env: string): Promise<void> {
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
