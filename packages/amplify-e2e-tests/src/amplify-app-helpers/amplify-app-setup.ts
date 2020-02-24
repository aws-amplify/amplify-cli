import * as nexpect from '../utils/nexpect-modified';
import * as path from 'path';
import * as fs from 'fs-extra';
import { isCI } from '../utils';

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const amplifyAppBinPath = path.join(__dirname, '..', '..', '..', 'amplify-app', 'bin', 'amplify-app');
const spawnCommand = isCI() ? 'amplify-app' : amplifyAppBinPath;

function amplifyAppAndroid(projRoot: string, verbose: Boolean = isCI() ? false : true) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(spawnCommand, ['--platform', 'android'], { cwd: projRoot, stripColors: true, verbose })
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
      .spawn(spawnCommand, ['--platform', 'ios'], { cwd: projRoot, stripColors: true, verbose })
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
      .spawn(spawnCommand, { cwd: projRoot, stripColors: true, verbose })
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
      .spawn(spawnCommand, { cwd: projRoot, stripColors: true, verbose })
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
    nexpect.spawn(npm, ['run', 'amplify-modelgen'], { cwd: projRoot, stripColors: true, verbose }).run(function(err) {
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
    nexpect.spawn(npm, ['run', 'amplify-push'], { cwd: projRoot, stripColors: true, verbose }).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function addIntegAccountInConfig(projRoot: string) {
  // add test account to config since no default account in circle ci
  if (isCI()) {
    const buildConfigPath = path.join(projRoot, 'amplify-build-config.json');
    const buildConfigFile = fs.readFileSync(buildConfigPath);
    let buildConfig = JSON.parse(buildConfigFile.toString());
    buildConfig.profile = 'amplify-integ-test-user';
    fs.writeFileSync(buildConfigPath, JSON.stringify(buildConfig));
  }
}

export { amplifyAppAndroid, amplifyAppIos, amplifyAppAngular, amplifyAppReact, amplifyModelgen, amplifyPush, addIntegAccountInConfig };
