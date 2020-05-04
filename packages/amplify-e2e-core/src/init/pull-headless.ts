import { nspawn as spawn, getCLIPath } from '../../src';

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
  appId: '',
};

export function pullProject(cwd: string, settings: Object) {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['pull', '--appId', s.appId, '--envName', s.envName], { cwd, stripColors: true })
      .wait('Do you want to use an AWS profile?')
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
      .sendLine('n')
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
