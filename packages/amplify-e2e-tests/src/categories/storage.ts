
import * as nexpect from 'nexpect';
import { join } from 'path';
import * as fs from 'fs';

import { getCLIPath, isCI, getEnvVars } from '../utils';
const defaultSettings = {
  projectName: 'CLI Storage test',
};


export function addSimpleDDB(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      // j = down arrow
      .sendline('j')
      .sendline('\r')
      .wait('Please provide a friendly name for your resource')
      .sendline('\r')
      .wait('Please provide table name')
      .sendline('\r')
      .wait('What would you like to name this column')
      .sendline('id')
      .sendline('\r')
      .wait('Please choose the data type')
      .sendline('\r')
      .wait('Would you like to add another column')
      .sendline('n')
      .sendline('\r')
      .wait('Please choose partition key for the table')
      .sendline('\r')
      .wait('Do you want to add a sort key to your table')
      .sendline('n')
      .sendline('\r')
      .wait('Do you want to add global secondary indexes to your table')
      .sendline('n')
      .sendline('\r')
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendline('n')
      .sendline('\r')
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

export function addDDBWithTrigger(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      // j = down arrow
      .sendline('j')
      .sendline('\r')
      .wait('Please provide a friendly name for your resource')
      .sendline('\r')
      .wait('Please provide table name')
      .sendline('\r')
      .wait('What would you like to name this column')
      .sendline('id')
      .sendline('\r')
      .wait('Please choose the data type')
      .sendline('\r')
      .wait('Would you like to add another column')
      .sendline('n')
      .sendline('\r')
      .wait('Please choose partition key for the table')
      .sendline('\r')
      .wait('Do you want to add a sort key to your table')
      .sendline('n')
      .sendline('\r')
      .wait('Do you want to add global secondary indexes to your table')
      .sendline('n')
      .sendline('\r')
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendline('y')
      .sendline('\r')
      .wait('Select from the following options')
      // j = down arrow
      .sendline('j')
      .sendline('\r')
      .wait('Do you want to edit the local')
      .sendline('n')
      .sendline('\r')
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

export function updateDDBWithTrigger(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true, verbose })
       .wait('Please select from one of the below mentioned services')
      // j = down arrow
      .sendline('j')
      .sendline('\r')
      .wait('Specify the resource that you would want to update')
      .sendline('\r')
      .wait('Would you like to add another column')
      .sendline('n')
      .sendline('\r')
      .wait('Do you want to add global secondary indexes to your table')
      .sendline('n')
      .sendline('\r')
       .wait('Do you want to add a Lambda Trigger for your Table')
      .sendline('y')
      .sendline('\r')
      .wait('Select from the following options')
      // j = down arrow
      .sendline('j')
      .sendline('\r')
      .wait('Do you want to edit the local')
      .sendline('n')
      .sendline('\r')
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


export function addS3WithTrigger(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendline('\r')
      .wait('Please provide a friendly name')
      .sendline('\r')
      .wait('Please provide bucket name')
      .sendline('\r')
      .wait('Who should have access')
      .sendline('\r')
      .wait('What kind of access do you want')
      .sendline('\r')
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendline('y')
      .sendline('\r')
      .wait('Select from the following options')
      // j = down arrow
      .sendline('j')
      .sendline('\r')
      .wait('Do you want to edit the local')
      .sendline('n')
      .sendline('\r')
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

