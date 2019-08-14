import * as nexpect from 'nexpect';

import { getCLIPath, isCI } from '../utils';

//content, auth user only, all access
export function addStorageWithDefault(
    cwd: string,
    settings: any = {},
    verbose: boolean = !isCI()
  ) {
    return new Promise((resolve, reject) => {
        nexpect
          .spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose})
          .wait('Please select from one of the below mentioned services')
          .sendline('\r')
          .wait('Please provide a friendly name for your resource that will be used to label')
          .sendline('\r')
          .wait('Please provide bucket name:')
          .sendline('\r')
          .wait('Who should have access:')
          .sendline('\r')
          .wait('What kind of access do you want for Authenticated users?')
          .sendline('a')
          .sendline('\r')
          .wait('Do you want to add a Lambda Trigger for your S3 Bucket?')
          .sendline('n\r')
          .run(function(err: Error) {
              if (!err) {
                  resolve();
              } else {
                  reject(err);
              }
          })
    })
  }