import { nspawn as spawn, getCLIPath } from '..';
import { EOL } from 'os';

const defaultSettings = {
  name: EOL,
  envName: 'integtest',
  editor: EOL,
  appType: EOL,
  framework: EOL,
  srcDir: EOL,
  distDir: EOL,
  buildCmd: EOL,
  startCmd: EOL,
  useProfile: EOL,
  profileName: EOL,
  appId: '',
};

export function pullProject(cwd: string, settings: Object): Promise<void> {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['pull', '--appId', s.appId, '--envName', s.envName], { cwd, stripColors: true })
      .wait('Select the authentication method you want to use:')
      .sendLine(s.useProfile)
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
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
      .wait('Do you plan on modifying this backend?')
      .sendConfirmNo()
      .wait('Added backend environment config object to your project.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
