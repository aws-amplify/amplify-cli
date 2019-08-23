
import * as nexpect from 'nexpect';
import { join } from 'path';
import * as fs from 'fs';

import { getCLIPath, isCI, getEnvVars } from '../utils';
const defaultSettings = {
  projectName: 'CLI Function test',
};


export function addHelloWorldFunction(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'function'], { cwd, stripColors: true, verbose })
      .wait('Provide a friendly name for your resource to be used as a label')
      .sendline('\r')
      .wait('Provide the AWS Lambda function name')
      .sendline('\r')
      .wait('Choose the function template that you want to use')
      .sendline('\r')
      .wait('Do you want to access other resources created in this project')
      .sendline('n')
      .wait('Do you want to edit the local lambda function now')
      .sendline('n')
      .sendEof()
      // tslint:disable-next-line
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}

export function functionBuild(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['function', 'build'], { cwd, stripColors: true, verbose })
      .wait('Are you sure you want to continue building the resources?')
      .sendline('Y')
      .sendEof()
      // tslint:disable-next-line
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}
