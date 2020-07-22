import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath } from '../../src';
import { singleSelect, multiSelect } from '../utils/selectors';

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

export function updateSimpleDDBwithGSI(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .send(KEY_DOWN_ARROW)
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
      .send(KEY_DOWN_ARROW)
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

// Adds auth and S3 to test case where user adds storage without adding auth first
export function addS3AndAuthWithAuthOnlyAccess(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('You need to add auth (Amazon Cognito) to your project in order to add storage')
      .sendLine('y')
      .wait('Do you want to use the default authentication and security configuration')
      .sendCarriageReturn() // Default config
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn() // Username
      .wait('Do you want to configure advanced settings')
      .sendCarriageReturn() // No, I am done.
      .wait('Please provide a friendly name for your resource')
      .sendCarriageReturn() // Default name
      .wait('Please provide bucket name')
      .sendCarriageReturn() // Default name
      .wait('Who should have access')
      .sendCarriageReturn() // Auth users only
      .wait('What kind of access do you want for Authenticated users')
      .send('i') // Select all
      .sendCarriageReturn()
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

export function addS3WithGuestAccess(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Please provide a friendly name for your resource')
      .sendCarriageReturn() // Default name
      .wait('Please provide bucket name')
      .sendCarriageReturn() // Default name
      .wait('Who should have access')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Auth and guest users
      .wait('What kind of access do you want for Authenticated users')
      .send('i') // Select all
      .sendCarriageReturn()
      .wait('What kind of access do you want for Guest users')
      .send(KEY_DOWN_ARROW)
      .send(' ') // Select read
      .sendCarriageReturn()
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

// Expects 2 existing user pool groups
export function addS3WithGroupAccess(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Please provide a friendly name for your resource')
      .sendCarriageReturn() // Default name
      .wait('Please provide bucket name')
      .sendCarriageReturn() // Default name
      .wait('Restrict access by')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Individual groups
      .wait('Select groups')
      .send('i') // Select all groups
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup1> users?
      .send('i') // Select all permissions
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup2> users?
      .send(' ') // Select create/update
      .send(KEY_DOWN_ARROW)
      .send(' ') // Select read
      .sendCarriageReturn()
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
      .send(' ')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendLine('y')
      .wait('Select from the following options')
      .send(KEY_DOWN_ARROW)
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

export function addS3Storage(projectDir: string) {
  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['add', 'storage'], { cwd: projectDir, stripColors: true });

    singleSelect(chain.wait('Please select from one of the below mentioned services:'), 'Content (Images, audio, video, etc.)', [
      'Content (Images, audio, video, etc.)',
      'NoSQL Database',
    ]);

    chain
      .wait('Please provide a friendly name for your resource that will be used to label this category in the project:')
      .sendCarriageReturn()
      .wait('Please provide bucket name:')
      .sendCarriageReturn();

    singleSelect(chain.wait('Who should have access:'), 'Auth and guest users', ['Auth users only', 'Auth and guest users']);

    multiSelect(
      chain.wait('What kind of access do you want for Authenticated users?'),
      ['create/update', 'read', 'delete'],
      ['create/update', 'read', 'delete'],
    );

    multiSelect(
      chain.wait('What kind of access do you want for Guest users?'),
      ['create/update', 'read', 'delete'],
      ['create/update', 'read', 'delete'],
    );

    chain.wait('Do you want to add a Lambda Trigger for your S3 Bucket?').sendLine('N');

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
