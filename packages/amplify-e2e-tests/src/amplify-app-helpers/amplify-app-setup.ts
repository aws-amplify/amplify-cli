import * as nexpect from '../utils/nexpect-modified';
import * as path from 'path';
import { isCI } from '../utils';

function getAmplifyAppPath() {
  if (isCI()) {
    return 'amplify-app';
  }
  return path.join(__dirname, '..', '..', '..', 'amplify-app', 'bin', 'amplify-app');
}

function amplifyAppAndroid(projRoot: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getAmplifyAppPath(), ['--platform', 'android'], { cwd: projRoot, stripColors: true, verbose })
      .wait('Successfully created base Amplify Project')
      .wait('Amplify setup completed successfully')
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyAppIos(projRoot: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getAmplifyAppPath(), ['--platform', 'ios'], { cwd: projRoot, stripColors: true, verbose })
      .wait('Successfully created base Amplify Project')
      .wait('Amplify setup completed successfully')
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyAppAngular(projRoot: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getAmplifyAppPath(), { cwd: projRoot, stripColors: true, verbose })
      .wait('What type of app are you building')
      .sendline('\r')
      .wait('What javascript framework are you using')
      .sendline('\r')
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyAppReact(projRoot: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getAmplifyAppPath(), { cwd: projRoot, stripColors: true, verbose })
      .wait('What type of app are you building')
      .sendline('\r')
      .wait('What javascript framework are you using')
      .sendline('jjj\r')
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyModelgen(projRoot: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect.spawn('npm', ['run', 'amplify-modelgen'], { cwd: projRoot, stripColors: true, verbose }).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function amplifyPush(projRoot: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect.spawn('npm', ['run', 'amplify-push'], { cwd: projRoot, stripColors: true, verbose }).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export { amplifyAppAndroid, amplifyAppIos, amplifyAppAngular, amplifyAppReact, amplifyModelgen, amplifyPush };
