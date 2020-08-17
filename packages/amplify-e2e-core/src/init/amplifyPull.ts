import { getCLIPath, nspawn as spawn } from '../../src';

export function amplifyPull(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    const tableHeaderRegex = /\|\sCategory\s+\|\sResource\sname\s+\|\sOperation\s+\|\sProvider\splugin\s+\|/;
    const tableSeperator = /\|(\s-+\s\|){4}/;

    const chain = spawn(getCLIPath(), ['pull'], { cwd, stripColors: true })
      .wait('Pre-pull status')
      .wait('Current Environment')
      .wait(tableHeaderRegex)
      .wait(tableSeperator);

    if (settings.override) {
      chain
        .wait('Local changes detected')
        .wait('Pulling changes from the cloud will override your local changes')
        .wait('Are you sure you would like to continue')
        .sendLine('y');
    }

    chain
      .wait('Post-pull status')
      .wait('Current Environment')
      .wait(tableHeaderRegex)
      .wait(tableSeperator)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          console.error(err);
          reject(err);
        }
      });
  });
}
