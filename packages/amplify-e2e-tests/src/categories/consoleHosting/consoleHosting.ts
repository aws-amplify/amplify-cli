import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../../utils';

export function addManualHosting(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'hosting'], { cwd, stripColors: true, verbose })
      .wait(/.*Hosting with Amplify Console*/)
      .sendline('\r')
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
      .wait(/.*Hosting with Amplify Console*/)
      .sendline('\r')
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

export function amplifyPublish(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['publish'], { cwd, stripColors: true, verbose })
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

export function amplifyConfigure(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['hosting', 'configure'], { cwd, stripColors: true, verbose })
      .wait(/.*We recommends you open AWS Amplify Console*/)
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

export function amplifyServe(cwd: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['hosting', 'configure'], { cwd, stripColors: true, verbose })
      .wait(/.*You have set up Manual deployment*/)
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

export function amplifyStatus(cwd: string, verbose: boolean = !isCI()) {
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
      .wait(/.*Are you sure you want to delete the resource*/)
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
