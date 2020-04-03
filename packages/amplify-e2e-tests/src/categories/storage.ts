import { nspawn as spawn, KEY_DOWN_ARROW } from 'amplify-e2e-core';
import { getCLIPath } from '../utils';

export function addSimpleDDB(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Please provide a friendly name for your resource')
      .sendLine(settings.name || '')
      .wait('Please provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .wait('Please choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendLine('n')
      .wait('Do you want to add global secondary indexes to your table')
      .sendLine('n')
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('n')
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

export function addDDBWithTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Please provide a friendly name for your resource')
      .sendCarriageReturn()
      .wait('Please provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .wait('Please choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendLine('n')
      .wait('Do you want to add global secondary indexes to your table')
      .sendLine('n')
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('y')
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Do you want to edit the local')
      .sendLine('n')
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

export function updateDDBWithTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .wait('Do you want to add global secondary indexes to your table')
      .sendLine('n')
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('y')
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Do you want to edit the local')
      .sendLine('n')
      .wait('overwrite')
      .sendLine('y')
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

export function addS3WithTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Please provide a friendly name')
      .sendCarriageReturn()
      .wait('Please provide bucket name')
      .sendCarriageReturn()
      .wait('Who should have access')
      .sendCarriageReturn()
      .wait('What kind of access do you want')
      .sendLine(' ')
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendLine('y')
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Do you want to edit the local')
      .sendLine('n')
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

export function addS3(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Please provide a friendly name')
      .sendCarriageReturn()
      .wait('Please provide bucket name')
      .sendCarriageReturn()
      .wait('Who should have access')
      .sendCarriageReturn()
      .wait('What kind of access do you want')
      .sendLine(' ')
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendLine('n')
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

export function updateSimpleDDBwithGSI(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('y')
      .wait('What would you like to name this column')
      .sendLine('gsi-col2')
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .wait('Do you want to add global secondary indexes to your table?')
      .sendLine('y')
      .wait('Please provide the GSI name')
      .sendLine('gsi2')
      .wait('Please choose partition key for the GSI')
      .sendCarriageReturn()
      .wait('Do you want to add more global secondary indexes to your table?')
      .sendLine('n')
      .wait('Do you want to keep existing global seconday indexes created on your table?')
      .sendLine('y')
      .wait('Do you want to add a Lambda Trigger for your Table?')
      .sendLine('n')
      .wait('overwrite')
      .sendLine('y')
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
export function addSimpleDDBwithGSI(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Please provide a friendly name for your resource')
      .sendCarriageReturn()
      .wait('Please provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('y')
      .wait('What would you like to name this column')
      .sendLine('gsi-col1')
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .wait('Please choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendLine('n')
      .wait('Do you want to add global secondary indexes to your table?')
      .sendLine('y')
      .wait('Please provide the GSI name')
      .sendLine('gsi1')
      .wait('Please choose partition key for the GSI')
      .sendCarriageReturn()
      .wait('Do you want to add more global secondary indexes to your table')
      .sendLine('n')
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('n')
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
