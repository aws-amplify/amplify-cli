import { nspawn as spawn } from 'amplify-e2e-core';
import { getCLIPath } from '../utils';

export async function newPlugin(cwd: string): Promise<string> {
  const pluginPackageDirName = 'newpluginpackage';

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'init'], { cwd, stripColors: true })
      .wait('What should be the name of the plugin')
      .sendLine(pluginPackageDirName)
      .wait('Specify the plugin type')
      .sendLine('')
      .wait('What Amplify CLI events do you want the plugin to handle')
      .sendLine('')
      .run((err: Error) => {
        if (!err) {
          resolve(pluginPackageDirName);
        } else {
          reject(err);
        }
      });
  });
}
