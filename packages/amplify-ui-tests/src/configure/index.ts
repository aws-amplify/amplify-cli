import * as nexpect from 'nexpect';

import { getCLIPath, isCI } from '../utils';
type AmplifyConfiguration = {
  accessKeyId: string,
  secretAccessKey: string,
  profileName?: string,
};
const defaultSettings = {
  profileName: 'amplify-integ-test-user',
  region: '\r',
  userName: '\r',
};

const MANDATORY_PARAMS = ['accessKeyId', 'secretAccessKey'];
export default function amplifyConfigure(
  settings: AmplifyConfiguration,
  verbose: Boolean = isCI() ? false : true
) {
  const s = { ...defaultSettings, ...settings };
  const missingParam = MANDATORY_PARAMS.filter(p => !Object.keys(s).includes(p));
  if (missingParam.length) {
    throw new Error(`mandatory params ${missingParam.join(' ')} are missing`);
  }

  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['configure'], { stripColors: true, verbose })
      .wait('Sign in to your AWS administrator account:')
      .wait('Press Enter to continue')
      .sendline('\r')
      .wait('Specify the AWS Region')
      .sendline('\r')
      .wait('user name:')
      .sendline('\r')
      .wait("Press Enter to continue")
      .sendline('\r')
      .wait('accessKeyId')
      .sendline(s.accessKeyId)
      .wait('secretAccessKey')
      .sendline(s.secretAccessKey)
      .wait('Profile Name:')
      .sendline(s.profileName)
      .wait(
        'Successfully set up the new user.'
      )
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
