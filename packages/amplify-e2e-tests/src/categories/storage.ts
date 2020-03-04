import { nspawn as spawn, KEY_DOWN_ARROW } from '../utils/nexpect';
import { getCLIPath, isCI } from '../utils';

export function addSimpleDDB(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Please provide a friendly name for your resource')
      .sendLine(settings.name || '')
      .wait('Please provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .sendCarriageReturn()
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Please choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add global secondary indexes to your table')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('n')
      .sendCarriageReturn()
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

export function addDDBWithTrigger(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Please provide a friendly name for your resource')
      .sendCarriageReturn()
      .wait('Please provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .sendCarriageReturn()
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Please choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add global secondary indexes to your table')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Do you want to edit the local')
      .sendLine('n')
      .sendCarriageReturn()
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

export function updateDDBWithTrigger(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add global secondary indexes to your table')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Do you want to edit the local')
      .sendLine('n')
      .sendCarriageReturn()
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

export function addS3WithTrigger(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Please provide a friendly name')
      .sendCarriageReturn()
      .wait('Please provide bucket name')
      .sendCarriageReturn()
      .wait('Who should have access')
      .sendCarriageReturn()
      .wait('What kind of access do you want')
      .send(' ')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Do you want to edit the local')
      .sendLine('n')
      .sendCarriageReturn()
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

export function updateSimpleDDBwithGSI(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('gsi-col2')
      .sendCarriageReturn()
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add global secondary indexes to your table?')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Please provide the GSI name')
      .sendLine('gsi2')
      .sendCarriageReturn()
      .wait('Please choose partition key for the GSI')
      .sendCarriageReturn()
      .wait('Do you want to add more global secondary indexes to your table?')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to keep existing global seconday indexes created on your table?')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your Table?')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('overwrite')
      .sendLine('y')
      .sendCarriageReturn()
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
export function addSimpleDDBwithGSI(cwd: string, settings: any, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true, verbose })
      .wait('Please select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Please provide a friendly name for your resource')
      .sendCarriageReturn()
      .wait('Please provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .sendCarriageReturn()
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('gsi-col1')
      .sendCarriageReturn()
      .wait('Please choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Please choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add global secondary indexes to your table?')
      .sendLine('y')
      .sendCarriageReturn()
      .wait('Please provide the GSI name')
      .sendLine('gsi1')
      .sendCarriageReturn()
      .wait('Please choose partition key for the GSI')
      .sendCarriageReturn()
      .wait('Do you want to add more global secondary indexes to your table')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendLine('n')
      .sendCarriageReturn()
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
