import * as nexpect from 'nexpect';
import { getCLIPath, isCI } from '../utils';

function amplifyPushApi(
  cwd: string,
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['push'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('y\r')
      .wait('Do you want to generate code for your newly created GraphQL API')
      .sendline('n\r')
      .sendEof()
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

function amplifyPush(
  cwd: string,
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['push'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue?')
      .sendline('y\r')
      .sendEof()
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export { amplifyPushApi, amplifyPush };