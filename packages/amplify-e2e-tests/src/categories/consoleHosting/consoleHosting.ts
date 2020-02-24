import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../../utils';
import { loadAppIdFromTeamProviderInfo, loadTypeFromTeamProviderInfo } from './utils';
import { Amplify } from 'aws-sdk';
import { ORIGINAL_ENV } from './constants';

export function addManualHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Manual deployment')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addCICDHostingWithoutFrontend(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Continuous deployment (Git-based deployments)')
      //move up
      .send('k')
      .sendline('\r')
      .wait(/.*Continuous deployment is configured in the Amplify Console.*/)
      .sendline('\r')
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

export function addCICDHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    createFrontEndPromise(cwd, verbose)
      .then(nexpectObject => {
        nexpectObject
          .sendline('\r')
          .wait('Hosting urls:')
          .run((err: Error) => {
            if (!err) {
              resolve();
            } else {
              reject(err);
            }
          });
      })
      .catch(err => {
        reject(err);
      });
  });
}

function createFrontEndPromise(cwd: string, verbose: boolean = !isCI()): Promise<nexpect.IChain> {
  return new Promise((resolve, reject) => {
    const nexpectObject: nexpect.IChain = nexpect
      .spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, verbose: true })
      .wait('Continuous deployment (Git-based deployments)')
      //move up
      .send('k')
      .sendline('\r')
      .wait(/.*Continuous deployment is configured in the Amplify Console.*/, data => {
        console.log(data);
        const amplify = new Amplify({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: 'us-west-2',
        });
        const appId = loadAppIdFromTeamProviderInfo(cwd, ORIGINAL_ENV);
        const result = amplify
          .createBranch({
            branchName: 'branch1',
            appId,
          })
          .promise()
          .then(result => {
            resolve(nexpectObject);
          })
          .catch(err => {
            reject(err);
          });
      });
    nexpectObject.run((err: Error) => {
      if (err) {
        reject(err);
      }
    });
  });
}

export function amplifyPublish(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['hosting', 'publish'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function amplifyPush(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['push'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('\r')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function npmInstall(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect.spawn('npm install', { cwd, stripColors: true, verbose }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function removeHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['remove', 'hosting'], { cwd, stripColors: true, verbose })
      .wait('Choose the resource you would want to remove')
      .sendline('\r')
      .wait('Are you sure you want to delete the resource?')
      .sendline('\r')
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
