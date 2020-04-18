import { nspawn as spawn, getCLIPath } from '../../src';

type AmplifyConfiguration = {
  accessKeyId: string;
  secretAccessKey: string;
  profileName?: string;
};

const defaultSettings = {
  profileName: 'amplify-integ-test-user',
  region: '\r',
  userName: '\r',
};

const MANDATORY_PARAMS = ['accessKeyId', 'secretAccessKey'];
export default function amplifyConfigure(settings: AmplifyConfiguration) {
  const s = { ...defaultSettings, ...settings };
  const missingParam = MANDATORY_PARAMS.filter(p => !Object.keys(s).includes(p));
  if (missingParam.length) {
    throw new Error(`mandatory params ${missingParam.join(' ')} are missing`);
  }

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['configure'], { stripColors: true })
      .wait('Sign in to your AWS administrator account:')
      .wait('Press Enter to continue')
      .sendCarriageReturn()
      .wait('Specify the AWS Region')
      .sendCarriageReturn()
      .wait('user name:')
      .sendCarriageReturn()
      .wait('Press Enter to continue')
      .sendCarriageReturn()
      .wait('accessKeyId')
      .pauseRecording()
      .sendLine(s.accessKeyId)
      .wait('secretAccessKey')
      .sendLine(s.secretAccessKey)
      .resumeRecording()
      .wait('Profile Name:')
      .sendLine(s.profileName)
      .wait('Successfully set up the new user.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
