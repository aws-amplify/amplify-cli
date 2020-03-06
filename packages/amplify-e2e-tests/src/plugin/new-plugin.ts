import { nspawn as spawn } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';

export async function newPlugin(cwd: string, verbose: boolean = isCI() ? false : true): Promise<string> {
  const pluginPackageDirName = 'newpluginpackage';

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'init'], { cwd, stripColors: true, verbose })
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
