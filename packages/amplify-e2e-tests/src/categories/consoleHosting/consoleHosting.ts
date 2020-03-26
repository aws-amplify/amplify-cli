import { nspawn as spawn } from 'amplify-e2e-core';
import * as nexpect from 'nexpect';
import { getCLIPath } from '../../utils';

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

export function npmInstall(cwd: string) {
  return new Promise((resolve, reject) => {
    nexpect.spawn('npm install', { cwd, stripColors: true }).run((err: Error) => {
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
