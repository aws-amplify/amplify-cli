import { nspawn as spawn, KEY_DOWN_ARROW } from '../utils/nexpect';
import * as path from 'path';
import * as fs from 'fs-extra';
import { isCI } from '../utils';

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const amplifyAppBinPath = path.join(__dirname, '..', '..', '..', 'amplify-app', 'bin', 'amplify-app');
const spawnCommand = isCI() ? 'amplify-app' : amplifyAppBinPath;

function amplifyAppAndroid(projRoot: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(spawnCommand, ['--platform', 'android'], { cwd: projRoot, stripColors: true, verbose })
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

function amplifyAppIos(projRoot: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(spawnCommand, ['--platform', 'ios'], { cwd: projRoot, stripColors: true, verbose })
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

function amplifyAppAngular(projRoot: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(spawnCommand, [], { cwd: projRoot, stripColors: true, verbose })
      .wait('What type of app are you building')
      .sendCarriageReturn()
      .wait('What javascript framework are you using')
      .sendCarriageReturn()
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyAppReact(projRoot: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(spawnCommand, [], { cwd: projRoot, stripColors: true, verbose })
      .wait('What type of app are you building')
      .sendCarriageReturn()
      .wait('What javascript framework are you using')
      .sendLine(`${KEY_DOWN_ARROW}${KEY_DOWN_ARROW}${KEY_DOWN_ARROW}`)
      .run(function(err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyModelgen(projRoot: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(npm, ['run', 'amplify-modelgen'], { cwd: projRoot, stripColors: true, verbose }).run(function(err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function amplifyPush(projRoot: string, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(npm, ['run', 'amplify-push'], { cwd: projRoot, stripColors: true, verbose }).run(function(err) {
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
