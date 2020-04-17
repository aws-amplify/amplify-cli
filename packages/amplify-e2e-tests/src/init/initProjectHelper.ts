import { nspawn as spawn } from 'amplify-e2e-core';
import { getCLIPath } from '../utils';

const defaultSettings = {
  name: '\r',
  envName: 'integtest',
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

export function initJSProjectWithProfile(cwd: string, settings: Object) {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
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
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendLine('y')
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
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

export function initAndroidProjectWithProfile(cwd: string, settings: Object) {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .send('j')
      .sendCarriageReturn()
      .wait('Where is your Res directory')
      .sendCarriageReturn()
      .wait('Do you want to use an AWS profile?')
      .sendLine('y')
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
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

export function initIosProjectWithProfile(cwd: string, settings: Object) {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
      .wait('Enter a name for the project')
      .sendLine(s.name)
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .send('j')
      .send('j')
      .sendCarriageReturn()
      .wait('Do you want to use an AWS profile?')
      .sendLine('y')
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
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

export function initProjectWithAccessKey(cwd: string, settings: { accessKeyId: string; secretAccessKey: string }) {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
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
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendLine('n')
      .pauseRecording()
      .wait('accessKeyId')
      .sendLine(s.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(s.secretAccessKey)
      .resumeRecording()
      .wait('region')
      .sendLine('us-east-2')
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

export function initNewEnvWithAccessKey(cwd: string, s: { envName: string; accessKeyId: string; secretAccessKey: string }) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendLine('n')
      .wait('accessKeyId')
      .sendLine(s.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(s.secretAccessKey)
      .wait('region')
      .sendLine('us-east-2')
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

export function initNewEnvWithProfile(cwd: string, s: { envName: string }) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
      .wait('Do you want to use an existing environment?')
      .sendLine('n')
      .wait('Enter a name for the environment')
      .sendLine(s.envName)
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendLine('y')
      .wait('Please choose the profile you want to use')
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
