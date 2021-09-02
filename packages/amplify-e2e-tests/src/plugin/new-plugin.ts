import { nspawn as spawn, getCLIPath } from 'amplify-e2e-core';

export async function newPlugin(cwd: string): Promise<string> {
  const pluginPackageDirName = 'newpluginpackage';

  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['plugin', 'init'], { cwd, stripColors: true })
      .wait('What should be the name of the plugin')
      .sendLine(pluginPackageDirName)
      .wait('Specify the plugin type')
      .sendLine('')
      .wait('What Amplify CLI events do you want the plugin to handle')
      .sendLine('a') //will select "Learn more"
      .wait('The Amplify CLI aims to provide a flexible and loosely-coupled pluggable platform for the plugins.')
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
