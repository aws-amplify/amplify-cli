import * as nexpect from 'nexpect';

import { getCLIPath, isCI } from '../utils';

export function addSampleInteraction(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'interactions'], { cwd, stripColors: true, verbose })
      .wait('Provide a friendly resource name that will be used to label this category')
      .sendline('\r')
      .wait('Would you like to start with a sample chatbot')
      .sendline('\r')
      .wait('Choose a sample chatbot:')
      .sendline('\r')
      .wait("Please indicate if your use of this bot is subject to the Children's")
      .sendline('y')
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
