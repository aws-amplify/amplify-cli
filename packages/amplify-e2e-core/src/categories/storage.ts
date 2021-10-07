import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath } from '..';
import { singleSelect, multiSelect } from '../utils/selectors';

export type AddStorageSettings = {
  resourceName: string;
  bucketName: string;
};

export type AddDynamoDBSettings = {
  resourceName: string;
  tableName: string;
  gsiName: string;
};

export function addSimpleDDB(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Provide a friendly name')
      .sendLine(settings.name || '\r')
      .wait('Provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .wait('Choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('y')
      .wait('What would you like to name this column')
      .sendLine('col2')
      .wait('Choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmNo()
      .wait('Choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmNo()
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

export function addDDBWithTrigger(cwd: string, settings: { ddbResourceName?: string }): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Provide a friendly name');
    if (settings.ddbResourceName) {
      chain.sendLine(settings.ddbResourceName);
    } else {
      chain.sendCarriageReturn();
    }
    chain
      .sendCarriageReturn()
      .wait('Provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .wait('Choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendLine('y')
      .wait('What would you like to name this column')
      .sendLine('col2')
      .wait('Choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmNo()
      .wait('Choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmYes()
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Do you want to edit the local')
      .sendConfirmNo()
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

export function updateDDBWithTrigger(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmYes()
      .wait('Select from the following options')
      .sendLine(KEY_DOWN_ARROW)
      .wait('Do you want to edit the local')
      .sendConfirmNo()
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

export function updateSimpleDDBwithGSI(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmYes()
      .wait('What would you like to name this column')
      .sendLine('gsi-col2')
      .wait('Choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmNo()
      .wait('Do you want to keep existing global seconday indexes created on your table?')
      .sendConfirmYes()
      .wait('Do you want to add global secondary indexes to your table?')
      .sendConfirmYes()
      .wait('Provide the GSI name')
      .sendLine('gsi2')
      .wait('Choose partition key for the GSI')
      .sendKeyDown()
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your global secondary index?')
      .sendConfirmNo()
      .wait('Do you want to add more global secondary indexes to your table?')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table?')
      .sendConfirmNo()
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

export function addSimpleDDBwithGSI(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Provide a friendly name')
      .sendCarriageReturn()
      .wait('Provide table name')
      .sendCarriageReturn()
      .wait('What would you like to name this column')
      .sendLine('id')
      .wait('Choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmYes()
      .wait('What would you like to name this column')
      .sendLine('gsi-col1')
      .wait('Choose the data type')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmNo()
      .wait('Choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table?')
      .sendConfirmYes()
      .wait('Provide the GSI name')
      .sendLine('gsi1')
      .wait('Choose partition key for the GSI')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your global secondary index?')
      .sendConfirmNo()
      .wait('Do you want to add more global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmNo()
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

export function overrideDDB(cwd: string, settings: {}) {
  return new Promise((resolve, reject) => {
    const args = ['override', 'storage'];

    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .wait('Do you want to edit override.ts file now?')
      .sendConfirmNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}

export function buildOverrideStorage(cwd: string, settings: {}) {
  return new Promise((resolve, reject) => {
    // Add 'storage' as a category param once implemented
    const args = ['build-override'];

    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}

export function addDynamoDBWithGSIWithSettings(projectDir: string, settings: AddDynamoDBSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['add', 'storage'], { cwd: projectDir, stripColors: true });

    singleSelect(chain.wait('Select from one of the below mentioned services:'), 'NoSQL Database', [
      'Content (Images, audio, video, etc.)',
      'NoSQL Database',
    ]);

    const addColumn = (name, type) => {
      chain.wait('What would you like to name this column').sendLine(name);

      singleSelect(chain.wait('Choose the data type'), type, ['string', 'number', 'binary', 'boolean', 'list', 'map', 'null']);
    };

    const addAnotherColumn = () => {
      chain.wait('Would you like to add another column').sendConfirmYes();
    };

    chain.wait('Provide a friendly name').sendLine(settings.resourceName).wait('Provide table name').sendLine(settings.tableName);

    addColumn('pk', 'string');
    addAnotherColumn();

    addColumn('sk', 'string');
    addAnotherColumn();

    addColumn('gsi-pk', 'string');
    addAnotherColumn();

    addColumn('gsi-sk', 'string');
    addAnotherColumn();

    addColumn('title', 'string');
    addAnotherColumn();

    addColumn('description', 'string');

    chain.wait('Would you like to add another column').sendConfirmNo();

    singleSelect(chain.wait('Choose the data type'), 'pk', ['pk', 'sk', 'gsi-pk', 'gsi-sk', 'title', 'description']);

    chain.wait('Do you want to add a sort key to your table').sendConfirmYes();

    singleSelect(chain.wait('Choose sort key for the table'), 'sk', ['sk', 'gsi-pk', 'gsi-sk', 'title', 'description']);

    chain
      .wait('Do you want to add global secondary indexes to your table?')
      .sendConfirmYes()
      .wait('Provide the GSI name')
      .sendLine(settings.gsiName);

    singleSelect(chain.wait('Choose partition key for the GSI'), 'gsi-pk', ['sk', 'gsi-pk', 'gsi-sk', 'title', 'description']);

    chain.wait('Do you want to add a sort key to your global secondary index').sendConfirmYes();

    singleSelect(chain.wait('Choose sort key for the GSI'), 'gsi-sk', ['sk', 'gsi-sk', 'title', 'description']);

    chain
      .wait('Do you want to add more global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmNo()
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

export function addS3(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Provide a friendly name')
      .sendCarriageReturn()
      .wait('Provide bucket name')
      .sendCarriageReturn()
      .wait('Who should have access')
      .sendCarriageReturn()
      .wait('What kind of access do you want')
      .sendLine(' ')
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmNo()
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
export function addS3AndAuthWithAuthOnlyAccess(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('You need to add auth (Amazon Cognito) to your project in order to add storage')
      .sendConfirmYes()
      .wait('Do you want to use the default authentication and security configuration')
      .sendCarriageReturn() // Default config
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn() // Username
      .wait('Do you want to configure advanced settings')
      .sendCarriageReturn() // No, I am done.
      .wait('Provide a friendly name for your resource')
      .sendCarriageReturn() // Default name
      .wait('Provide bucket name')
      .sendCarriageReturn() // Default name
      .wait('Who should have access')
      .sendCarriageReturn() // Auth users only
      .wait('What kind of access do you want for')
      .sendCtrlA() // Select all
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmNo()
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

export function addS3WithGuestAccess(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Provide a friendly name for your resource')
      .sendCarriageReturn() // Default name
      .wait('Provide bucket name')
      .sendCarriageReturn() // Default name
      .wait('Who should have access')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Auth and guest users
      .wait('What kind of access do you want for')
      .send(' ') // Create
      .send(KEY_DOWN_ARROW)
      .send(' ') // Read
      .send(KEY_DOWN_ARROW)
      .send(' ') // Delete
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('What kind of access do you want for')
      .send(KEY_DOWN_ARROW)
      .send(' ') // Select read
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmNo()
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
export function addS3WithGroupAccess(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Provide a friendly name for your resource')
      .sendCarriageReturn() // Default name
      .wait('Provide bucket name')
      .sendCarriageReturn() // Default name
      .wait('Restrict access by')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Individual groups
      .wait('Select groups')
      .send(' ')
      .send(KEY_DOWN_ARROW) //select Admin
      .send(' ')
      .send(KEY_DOWN_ARROW) //select User
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup1> users?
      .sendCtrlA() // Select all permissions
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup2> users?
      .send(' ') // Select create/update
      .send(KEY_DOWN_ARROW)
      .send(' ') // Select read
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmNo()
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

export function addS3WithTrigger(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn()
      .wait('Provide a friendly name')
      .sendCarriageReturn()
      .wait('Provide bucket name')
      .sendCarriageReturn()
      .wait('Who should have access')
      .sendCarriageReturn()
      .wait('What kind of access do you want')
      .send(' ')
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmYes()
      .wait('Select from the following options')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Do you want to edit the local')
      .sendConfirmNo()
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

export function updateS3AddTrigger(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Restrict access by')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Individual groups
      .wait('Select groups')
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup1> users?
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup2> users?
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmYes()
      .wait('Select from the following options')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() //Create a new function
      .wait('Do you want to edit the local')
      .sendConfirmNo()
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

export function addS3Storage(projectDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['add', 'storage'], { cwd: projectDir, stripColors: true });

    singleSelect(chain.wait('Select from one of the below mentioned services:'), 'Content (Images, audio, video, etc.)', [
      'Content (Images, audio, video, etc.)',
      'NoSQL Database',
    ]);

    chain
      .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
      .sendCarriageReturn()
      .wait('Provide bucket name:')
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

    chain.wait('Do you want to add a Lambda Trigger for your S3 Bucket?').sendConfirmNo();

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function overrideS3(cwd: string, settings: {}) {
  return new Promise((resolve, reject) => {
    const args = ['override', 'storage'];
    spawn(getCLIPath(), args, { cwd, stripColors: true })
      .wait('Do you want to edit override.ts file now?')
      .sendConfirmNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}


export function addS3StorageWithSettings(projectDir: string, settings: AddStorageSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['add', 'storage'], { cwd: projectDir, stripColors: true });

    singleSelect(chain.wait('Select from one of the below mentioned services:'), 'Content (Images, audio, video, etc.)', [
      'Content (Images, audio, video, etc.)',
      'NoSQL Database',
    ]);

    chain
      .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
      .sendLine(settings.resourceName)
      .wait('Provide bucket name:')
      .sendLine(settings.bucketName);

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

    chain.wait('Do you want to add a Lambda Trigger for your S3 Bucket?').sendConfirmNo();

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
