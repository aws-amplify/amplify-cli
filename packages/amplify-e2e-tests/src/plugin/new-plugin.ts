import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export async function newPlugin(cwd: string, verbose: Boolean = isCI() ? false : true): Promise<string> {
  const pluginPackageDirName = 'newpluginpackage';

  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['plugin', 'init'], { cwd, stripColors: true, verbose })
      .wait('What should be the name of the plugin')
      .send(pluginPackageDirName + '\r')
      .wait('Specify the plugin type')
      .send('\r')
      .wait('What Amplify CLI events do you want the plugin to handle')
      .send('\r')
      .run((err: Error) => {
        if (!err) {
          resolve(pluginPackageDirName);
        } else {
          reject(err);
        }
      });
  });
}
