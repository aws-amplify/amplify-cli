import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

export default function amplifyPush(
  cwd: string,
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['push'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('y')
      .wait('Do you want to generate code for your newly created GraphQL API')
      .sendline('n')
      .wait(/.*/)
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
