import { nspawn as spawn, getCLIPath, singleSelect } from '../../src';

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
  region: process.env.CLI_REGION,
  local: false,
};

const amplifyRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ca-central-1',
];

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

export function initProjectWithAccessKey(cwd: string, settings: { accessKeyId: string; secretAccessKey: string; region?: string }) {
  const s = { ...defaultSettings, ...settings };

  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
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
      .wait('region');

      singleSelect(chain, settings.region, amplifyRegions);

      chain.wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
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
    let chain = spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
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
