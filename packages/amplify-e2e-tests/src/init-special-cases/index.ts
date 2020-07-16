import path from 'path';
import { nspawn as spawn, singleSelect, amplifyRegions } from 'amplify-e2e-core';

export async function initWithoutCredentialFileAndNoNewUserSetup(cwd) {
  const settings = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.CLI_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2',
  };
  
  const exePath = path.join(__dirname, './setupAndInit');
  
  return new Promise((resolve, reject) => {
    let chain = spawn(exePath, [], { cwd, stripColors: true })
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
