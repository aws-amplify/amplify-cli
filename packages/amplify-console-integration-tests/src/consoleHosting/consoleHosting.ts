import { nspawn as spawn } from '@aws-amplify/amplify-e2e-core';
import { getCLIPath } from '../util';
import { HOSTING_NOT_ENABLED, HOSTING_ENABLED_IN_CONSOLE } from './constants';

export const deleteProject = async (cwd: string): Promise<void> => {
  const noOutputTimeout = 10 * 60 * 1000; // 10 minutes
  return spawn(getCLIPath(), ['delete'], { cwd, stripColors: true, noOutputTimeout })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait('Project deleted locally.')
    .runAsync();
};

export function addEnvironment(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['env', 'add', '--providers', JSON.stringify(settings.providersParam)], { cwd, stripColors: true })
      .wait('Enter a name for the environment')
      .sendLine(settings.envName)
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

export const amplifyPublish = async (cwd: string): Promise<void> => {
  return spawn(getCLIPath(), ['publish'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendCarriageReturn()
    .runAsync();
};

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
    const regex = new RegExp(`.*${expectedStatus}*`);
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

export const amplifyPush = async (cwd: string): Promise<void> => {
  return spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendCarriageReturn()
    .runAsync();
};

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
