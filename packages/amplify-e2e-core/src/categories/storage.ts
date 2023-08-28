import { singleSelect } from '../utils/selectors';
import { getCLIPath, nspawn as spawn, RETURN } from '..';

export type AddStorageSettings = {
  resourceName?: string;
  bucketName?: string;
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
      .sendKeyDown()
      .sendCarriageReturn()
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
      .sendLine('n')
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
      .sendKeyDown()
      .sendCarriageReturn()
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
      .sendLine('n')
      .wait('Choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmYes()
      .wait('Select from the following options')
      .sendKeyDown()
      .sendCarriageReturn()
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
    spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Would you like to add another column')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmYes()
      .wait('Select from the following options')
      .sendKeyDown()
      .sendCarriageReturn()
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

export function updateDDBWithTriggerMigration(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Specify the resource that you would want to update')
      .sendCarriageReturn()
      .wait('Do you want to migrate storage resource')
      .sendConfirmYes()
      .wait('Would you like to add another column')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table')
      .sendConfirmNo()
      .wait('Do you want to add a Lambda Trigger for your Table')
      .sendConfirmYes()
      .wait('Select from the following options')
      .sendKeyDown()
      .sendCarriageReturn()
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

export function updateSimpleDDBwithGSI(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendKeyDown()
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
      .sendLine('n')
      .wait('Do you want to keep existing global secondary indexes created on your table?')
      .sendLine('y')
      .wait('Do you want to add global secondary indexes to your table?')
      .sendLine('y')
      .wait('Provide the GSI name')
      .sendLine('gsi2')
      .wait('Choose partition key for the GSI')
      .sendKeyDown()
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your global secondary index?')
      .sendConfirmNo()
      .wait('Do you want to add more global secondary indexes to your table?')
      .sendLine('n')
      .wait('Do you want to add a Lambda Trigger for your Table?')
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

export function addSimpleDDBwithGSI(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendKeyDown()
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
      .sendLine('n')
      .wait('Choose partition key for the table')
      .sendCarriageReturn()
      .wait('Do you want to add a sort key to your table')
      .sendConfirmNo()
      .wait('Do you want to add global secondary indexes to your table?')
      .sendLine('y')
      .wait('Provide the GSI name')
      .sendLine('gsi1')
      .wait('Choose partition key for the GSI')
      .sendKeyDown()
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

export function overrideDDB(cwd: string) {
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

export function buildOverrideStorage(cwd: string, env?: Record<string, string>) {
  return new Promise((resolve, reject) => {
    // Add 'storage' as a category param once implemented
    const args = ['build'];
    const chain = spawn(getCLIPath(), args, { cwd, stripColors: true, env });
    chain.run((err: Error) => {
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
    const chain = spawn(getCLIPath(), ['add', 'storage'], { cwd: projectDir, stripColors: true });

    singleSelect(chain.wait('Select from one of the below mentioned services:'), 'NoSQL Database', [
      'Content (Images, audio, video, etc.)',
      'NoSQL Database',
    ]);

    const addColumn = (name) => {
      chain.wait('What would you like to name this column').sendLine(name);

      chain.wait('Choose the data type').sendCarriageReturn(); // Always selects string
    };

    const addAnotherColumn = () => {
      chain.wait('Would you like to add another column').sendConfirmYes();
    };

    chain.wait('Provide a friendly name').sendLine(settings.resourceName).wait('Provide table name').sendLine(settings.tableName);

    addColumn('pk');
    addAnotherColumn();

    addColumn('sk');
    addAnotherColumn();

    addColumn('gsi-pk');
    addAnotherColumn();

    addColumn('gsi-sk');
    addAnotherColumn();

    addColumn('title');
    addAnotherColumn();

    addColumn('description');

    chain.wait('Would you like to add another column').sendConfirmNo();

    chain.wait('Choose partition key for the table').sendCarriageReturn(); // choose pk

    chain.wait('Do you want to add a sort key to your table').sendConfirmYes();

    chain.wait('Choose sort key for the table').sendCarriageReturn(); // choose sk

    chain
      .wait('Do you want to add global secondary indexes to your table?')
      .sendConfirmYes()
      .wait('Provide the GSI name')
      .sendLine(settings.gsiName);

    chain.wait('Choose partition key for the GSI').sendKeyDown(2).sendCarriageReturn(); // choose gsi-pk

    chain.wait('Do you want to add a sort key to your global secondary index').sendConfirmYes();

    chain.wait('Choose sort key for the GSI').sendKeyDown(2).sendCarriageReturn(); // choose gsi-sk

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

export function addS3(cwd: string): Promise<void> {
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
export function addS3AndAuthWithAuthOnlyAccess(cwd: string): Promise<void> {
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
      .wait('What kind of access do you want for Authenticated users?')
      .selectAll()
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

export function addS3WithGuestAccess(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Provide a friendly name for your resource')
      .sendCarriageReturn() // Default name
      .wait('Provide bucket name')
      .sendCarriageReturn() // Default name
      .wait('Who should have access')
      .sendKeyDown()
      .sendCarriageReturn() // Auth and guest users
      .wait('What kind of access do you want for Authenticated users?')
      .selectAll()
      .wait('What kind of access do you want for Guest users?')
      .selectAll()
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
export function addS3WithGroupAccess(cwd: string, settings?: { userGroup1?: string; userGroup2?: string }): Promise<void> {
  return spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
    .wait('Select from one of the below mentioned services')
    .sendCarriageReturn() // Content
    .wait('Provide a friendly name for your resource')
    .sendCarriageReturn() // Default name
    .wait('Provide bucket name')
    .sendCarriageReturn() // Default name
    .wait('Restrict access by')
    .sendKeyDown()
    .sendCarriageReturn() // Individual groups
    .wait('Select groups')
    .selectAll() // select all groups
    .wait(`What kind of access do you want for ${settings?.userGroup1 ?? 'Admins'} users`) // for <UserGroup1> users?
    .selectAll() // Select all permissions
    .wait(`What kind of access do you want for ${settings?.userGroup2 ?? 'Users'} users`) // for <UserGroup2> users?
    .selectAll() // Select all permissions
    .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
    .sendConfirmNo()
    .sendEof()
    .runAsync();
}

export function addS3WithFirstGroupAccess(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['add', 'storage'], { cwd, stripColors: true })
    .wait('Select from one of the below mentioned services')
    .sendCarriageReturn() // Content
    .wait('Provide a friendly name for your resource')
    .sendCarriageReturn() // Default name
    .wait('Provide bucket name')
    .sendCarriageReturn() // Default name
    .wait('Restrict access by')
    .sendKeyDown()
    .sendCarriageReturn() // Individual groups
    .wait('Select groups')
    .send(' ') // select first group
    .sendCarriageReturn()
    .wait(`What kind of access do you want for`)
    .selectAll() // Select all permissions
    .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
    .sendNo()
    .sendCarriageReturn()
    .runAsync();
}

export function addS3WithTrigger(cwd: string): Promise<void> {
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

export function updateS3AddTrigger(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Restrict access by')
      .sendKeyDown()
      .sendCarriageReturn() // Individual groups
      .wait('Select groups')
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup1> users?
      .sendCarriageReturn()
      .wait('What kind of access do you want') // for <UserGroup2> users?
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmYes()
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

export function updateS3AddTriggerWithAuthOnlyReqMigration(cwd: string, settings: any): Promise<void> {
  const testingWithLatestCodebase = settings.testingWithLatestCodebase;
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Do you want to migrate storage resource') // Migration workflow
      .sendConfirmYes()
      .wait('Do you want to migrate auth resource') // Auth Migration workflow
      .sendConfirmYes()
      .wait('Who should have access:')
      .sendCarriageReturn() // Auth only users
      .wait('What kind of access do you want for Authenticated users?')
      .sendCarriageReturn() // Select preselected permissions
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket?')
      .sendConfirmYes()
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

export function updateS3AddTriggerNewFunctionWithFunctionExisting(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'storage'], { cwd, stripColors: true })
      .wait('Select from one of the below mentioned services')
      .sendCarriageReturn() // Content
      .wait('Restrict access by')
      .sendKeyDown()
      .sendCarriageReturn() // Individual groups
      .wait('Select groups')
      .sendCarriageReturn()
      .wait(`What kind of access do you want for ${settings.userGroup1}`) // for <UserGroup1> users?
      .sendCarriageReturn()
      .wait(`What kind of access do you want for ${settings.userGroup2}`) // for <UserGroup2> users?
      .sendCarriageReturn()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
      .sendConfirmYes()
      .wait('Select from the following options')
      .sendKeyDown()
      .sendCarriageReturn() //Create a new function
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

export function addS3StorageWithIdpAuth(projectDir: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'storage'], { cwd: projectDir, stripColors: true });

    chain.wait('Select from one of the below mentioned services:').sendCarriageReturn(); //select - Content (Images, audio, video, etc.)

    chain
      .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
      .sendCarriageReturn()
      .wait('Provide bucket name:')
      .sendCarriageReturn()
      .wait('Restrict access by')
      .sendCarriageReturn()
      .wait('Who should have access:')
      .sendCarriageReturn();

    chain
      .wait('What kind of access do you want for Authenticated users?')
      .send(' ') //'create/update'
      .sendKeyDown()
      .send(' ') //'read'
      .sendKeyDown()
      .send(' ') //'delete'
      .sendCarriageReturn();

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

export function addS3Storage(projectDir: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'storage'], { cwd: projectDir, stripColors: true });
    chain
      .wait('Select from one of the below mentioned services:') //'Content (Images, audio, video, etc.)'
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
      .sendCarriageReturn()
      .wait('Provide bucket name:')
      .sendCarriageReturn()
      .wait('Who should have access:')
      .sendKeyDown()
      .send(' ') //Auth and guest
      .sendCarriageReturn()
      .wait('What kind of access do you want for Authenticated users?') //Auth
      .selectAll()
      .wait('What kind of access do you want for Guest users?') //Guest
      .selectAll()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket?')
      .sendConfirmNo()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addS3StorageWithAuthOnly(projectDir: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'storage'], { cwd: projectDir, stripColors: true });
    chain
      .wait('Select from one of the below mentioned services:') //'Content (Images, audio, video, etc.)'
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
      .sendCarriageReturn()
      .wait('Provide bucket name:')
      .sendCarriageReturn()
      .wait('Who should have access:')
      .sendCarriageReturn() //Auth users only
      .wait('What kind of access do you want for Authenticated users?') //Auth
      .selectAll()
      .wait('Do you want to add a Lambda Trigger for your S3 Bucket?')
      .sendConfirmNo()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function overrideS3(cwd: string) {
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
    const chain = spawn(getCLIPath(), ['add', 'storage'], { cwd: projectDir, stripColors: true });

    chain
      .wait('Select from one of the below mentioned services:')
      .send(' ') //'Content (Images, audio, video, etc.)'
      .sendCarriageReturn();

    chain
      .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
      .sendLine(settings.resourceName || RETURN)
      .wait('Provide bucket name:')
      .sendLine(settings.bucketName || RETURN);

    chain.wait('Who should have access:').sendKeyDown().send(' ').sendCarriageReturn();

    chain.wait('What kind of access do you want for Authenticated users?').selectAll();

    chain.wait('What kind of access do you want for Guest users?').selectAll();

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
