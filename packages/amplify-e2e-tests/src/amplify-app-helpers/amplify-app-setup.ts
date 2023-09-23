import { nspawn as spawn, KEY_DOWN_ARROW, isCI, isSmokeTestRun } from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';

const isRunningOnWindows = /^win/.test(process.platform);
const npm = isRunningOnWindows ? 'npm.cmd' : 'npm';
const npx = isRunningOnWindows ? 'npx.cmd' : 'npx';
const amplifyAppBinPath = path.join(__dirname, '..', '..', '..', 'amplify-app', 'bin', 'amplify-app');
const getSpawnCommand = () => {
  if (isSmokeTestRun()) {
    return [npx, 'amplify-app', '--yes'];
  } else if (isCI() && !isRunningOnWindows) {
    return 'amplify-app';
  } else {
    return amplifyAppBinPath;
  }
};

function amplifyAppAndroid(projRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getSpawnCommand(), ['--platform', 'android'], { cwd: projRoot, stripColors: true })
      .wait('Successfully created base Amplify Project')
      .wait('Amplify setup completed successfully')
      .run(function (err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyAppIos(projRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getSpawnCommand(), ['--platform', 'ios'], { cwd: projRoot, stripColors: true })
      .wait('Successfully created base Amplify Project')
      .wait('Amplify setup completed successfully')
      .run(function (err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyAppAngular(projRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getSpawnCommand(), [], { cwd: projRoot, stripColors: true })
      .wait('What type of app are you building')
      .sendCarriageReturn()
      .wait('What javascript framework are you using')
      .sendCarriageReturn()
      .run(function (err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyAppReact(projRoot: string): Promise<void> {
  const env: Record<string, string> = {};
  if (isSmokeTestRun()) {
    // If we're smoke testing we have to prepend a directory component of AMPLIFY_PATH to PATH
    // Internally amplify-app spawns 'amplify' which makes OS look into PATH
    // However, yarn injects local binaries into PATH as well which makes OS find packages/amplify-cli/bin content
    // and packages are not fully built in smoke tests.
    // OS traverses PATH from left to right, so prepending forces it to use AMPLIFY_PATH location.
    if (!process.env.AMPLIFY_PATH) {
      throw new Error('AMPLIFY_PATH must be set in smoke tests');
    }
    const amplifyPathDir = path.parse(process.env.AMPLIFY_PATH).dir;
    let pathEnvVar = process.env.PATH;
    const separator = isRunningOnWindows ? ';' : ':';
    pathEnvVar = amplifyPathDir + separator + pathEnvVar;
    env['PATH'] = pathEnvVar;
  }
  return new Promise((resolve, reject) => {
    spawn(getSpawnCommand(), [], { cwd: projRoot, stripColors: true, env })
      .wait('What type of app are you building')
      .sendCarriageReturn()
      .wait('What javascript framework are you using')
      .sendLine(`${KEY_DOWN_ARROW}${KEY_DOWN_ARROW}${KEY_DOWN_ARROW}`)
      .run(function (err) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyModelgen(projRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(npm, ['run', 'amplify-modelgen'], { cwd: projRoot, stripColors: true }).run(function (err) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

function amplifyPush(projRoot: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(npm, ['run', 'amplify-push'], { cwd: projRoot, stripColors: true }).run(function (err) {
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
    const buildConfig = JSON.parse(buildConfigFile.toString());
    buildConfig.profile = 'amplify-integ-test-user';
    fs.writeFileSync(buildConfigPath, JSON.stringify(buildConfig));
  }
}

export { amplifyAppAndroid, amplifyAppIos, amplifyAppAngular, amplifyAppReact, amplifyModelgen, amplifyPush, addIntegAccountInConfig };
