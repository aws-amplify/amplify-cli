import path from 'path';
import { nspawn as spawn, getCLIPath, singleSelect, amplifyRegions, addCircleCITags, KEY_DOWN_ARROW } from '@aws-amplify/amplify-e2e-core';
import fs from 'fs-extra';
import os from 'os';

export async function initWithoutCredentialFileAndNoNewUserSetup(projRoot) {
  const settings = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
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
  } finally {
    // reset credentials and config files
    if (fs.existsSync(configFilePathHide)) {
      fs.renameSync(configFilePathHide, configFilePath);
    }
    if (fs.existsSync(credentialsFilePathHide)) {
      fs.renameSync(credentialsFilePathHide, credentialsFilePath);
    }
    process.env.AWS_ACCESS_KEY_ID = settings.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = settings.secretAccessKey;
    process.env.AWS_DEFAULT_REGION = settings.region;
    process.env.AWS_REGION = settings.region;
  }
}

async function initWorkflow(cwd: string, settings: { accessKeyId: string; secretAccessKey: string; region: string }): Promise<void> {
  addCircleCITags(cwd);

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['init'], {
      cwd,
      stripColors: true,
      env: {
        CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
      },
    })
      .wait('Do you want to continue with Amplify Gen 1?')
      .sendYes()
      .wait('Why would you like to use Amplify Gen 1?')
      .sendCarriageReturn()
      .wait('Enter a name for the project')
      .sendCarriageReturn()
      .wait('Initialize the project with the above configuration?')
      .sendConfirmNo()
      .wait('Enter a name for the environment')
      .sendCarriageReturn()
      .wait('Choose your default editor:')
      .sendCarriageReturn()
      .wait("Choose the type of app that you're building")
      .sendLine('javascript')
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
      .wait('Select the authentication method you want to use:')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .pauseRecording()
      .wait('accessKeyId')
      .sendLine(settings.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(settings.secretAccessKey)
      .resumeRecording()
      .wait('region');

    singleSelect(chain, settings.region, amplifyRegions);
    chain
      .wait('Help improve Amplify CLI by sharing non-sensitive project configurations on failures')
      .sendYes()
      .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
