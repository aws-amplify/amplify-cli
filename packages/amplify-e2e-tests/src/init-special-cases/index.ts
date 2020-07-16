import path from 'path';
import { nspawn as spawn, getCLIPath, singleSelect, amplifyRegions } from 'amplify-e2e-core';
import fs from 'fs-extra';
import os from 'os';

export async function initWithoutCredentialFileAndNoNewUserSetup(projRoot) {
  const settings = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2',
  };

  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.AWS_DEFAULT_REGION;
  delete process.env.AWS_REGION;

  const dotAWSDirPath = path.normalize(path.join(os.homedir(), '.aws'));
  const credentialsFilePath = path.join(dotAWSDirPath, 'credentials');
  const configFilePath = path.join(dotAWSDirPath, 'config');
  const credentialsFilePathHide = path.join(dotAWSDirPath, 'credentials.hide');
  const configFilePathHide = path.join(dotAWSDirPath, 'config.hide');

  try {
    if (fs.existsSync(configFilePath)) {
      fs.renameSync(configFilePath, configFilePathHide);
    }
    if (fs.existsSync(credentialsFilePath)) {
      fs.renameSync(credentialsFilePath, credentialsFilePathHide);
    }
    await initWorkflow(projRoot, settings);
  } catch (e) {
    throw e;
  } finally {
    if (fs.existsSync(configFilePathHide)) {
      fs.renameSync(configFilePathHide, configFilePath);
    }
    if (fs.existsSync(credentialsFilePathHide)) {
      fs.renameSync(credentialsFilePathHide, credentialsFilePath);
    }
  }
}

async function initWorkflow(cwd: string, settings: { accessKeyId: string; secretAccessKey: string; region: string }) {
  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['init'], { cwd, stripColors: true })
      .wait('Enter a name for the project')
      .sendCarriageReturn()
      .wait('Enter a name for the environment')
      .sendCarriageReturn()
      .wait('Choose your default editor:')
      .sendCarriageReturn()
      .wait("Choose the type of app that you're building")
      .sendCarriageReturn()
      .wait('What javascript framework are you using')
      .sendCarriageReturn()
      .wait('Source Directory Path:')
      .sendCarriageReturn()
      .wait('Distribution Directory Path:')
      .sendCarriageReturn()
      .wait('Build Command:')
      .sendCarriageReturn()
      .wait('Start Command:')
      .sendCarriageReturn()
      .wait('Using default provider  awscloudformation')
      .wait('AWS access credentials can not be found.')
      .wait('Setup new user')
      .sendLine('n')
      .pauseRecording()
      .wait('accessKeyId')
      .sendLine(settings.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(settings.secretAccessKey)
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
