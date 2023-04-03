"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addS3StorageWithSettings = exports.overrideS3 = exports.addS3StorageWithAuthOnly = exports.addS3Storage = exports.addS3StorageWithIdpAuth = exports.updateS3AddTriggerNewFunctionWithFunctionExisting = exports.updateS3AddTriggerWithAuthOnlyReqMigration = exports.updateS3AddTrigger = exports.addS3WithTrigger = exports.addS3WithGroupAccess = exports.addS3WithGuestAccess = exports.addS3AndAuthWithAuthOnlyAccess = exports.addS3 = exports.addDynamoDBWithGSIWithSettings = exports.buildOverrideStorage = exports.overrideDDB = exports.addSimpleDDBwithGSI = exports.updateSimpleDDBwithGSI = exports.updateDDBWithTriggerMigration = exports.updateDDBWithTrigger = exports.addDDBWithTrigger = exports.addSimpleDDB = void 0;
const selectors_1 = require("../utils/selectors");
const __1 = require("..");
function addSimpleDDB(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addSimpleDDB = addSimpleDDB;
function addDDBWithTrigger(cwd, settings) {
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
            .wait('Select from one of the below mentioned services')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('Provide a friendly name');
        if (settings.ddbResourceName) {
            chain.sendLine(settings.ddbResourceName);
        }
        else {
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addDDBWithTrigger = addDDBWithTrigger;
function updateDDBWithTrigger(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), ['update', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateDDBWithTrigger = updateDDBWithTrigger;
function updateDDBWithTriggerMigration(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), ['update', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateDDBWithTriggerMigration = updateDDBWithTriggerMigration;
function updateSimpleDDBwithGSI(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['update', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateSimpleDDBwithGSI = updateSimpleDDBwithGSI;
function addSimpleDDBwithGSI(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addSimpleDDBwithGSI = addSimpleDDBwithGSI;
function overrideDDB(cwd) {
    return new Promise((resolve, reject) => {
        const args = ['override', 'storage'];
        (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true })
            .wait('Do you want to edit override.ts file now?')
            .sendConfirmNo()
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve({});
            }
            else {
                reject(err);
            }
        });
    });
}
exports.overrideDDB = overrideDDB;
function buildOverrideStorage(cwd) {
    return new Promise((resolve, reject) => {
        // Add 'storage' as a category param once implemented
        const args = ['build'];
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true });
        chain.run((err) => {
            if (!err) {
                resolve({});
            }
            else {
                reject(err);
            }
        });
    });
}
exports.buildOverrideStorage = buildOverrideStorage;
function addDynamoDBWithGSIWithSettings(projectDir, settings) {
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd: projectDir, stripColors: true });
        (0, selectors_1.singleSelect)(chain.wait('Select from one of the below mentioned services:'), 'NoSQL Database', [
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addDynamoDBWithGSIWithSettings = addDynamoDBWithGSIWithSettings;
function addS3(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3 = addS3;
// Adds auth and S3 to test case where user adds storage without adding auth first
function addS3AndAuthWithAuthOnlyAccess(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3AndAuthWithAuthOnlyAccess = addS3AndAuthWithAuthOnlyAccess;
function addS3WithGuestAccess(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3WithGuestAccess = addS3WithGuestAccess;
// Expects 2 existing user pool groups
function addS3WithGroupAccess(cwd, settings) {
    return new Promise((resolve, reject) => {
        var _a, _b;
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
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
            .wait(`What kind of access do you want for ${(_a = settings === null || settings === void 0 ? void 0 : settings.userGroup1) !== null && _a !== void 0 ? _a : 'Admins'} users`) // for <UserGroup1> users?
            .selectAll() // Select all permissions
            .wait(`What kind of access do you want for ${(_b = settings === null || settings === void 0 ? void 0 : settings.userGroup2) !== null && _b !== void 0 ? _b : 'Users'} users`) // for <UserGroup2> users?
            .selectAll() // Select all permissions
            .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
            .sendConfirmNo()
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3WithGroupAccess = addS3WithGroupAccess;
function addS3WithTrigger(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3WithTrigger = addS3WithTrigger;
function updateS3AddTrigger(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['update', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateS3AddTrigger = updateS3AddTrigger;
function updateS3AddTriggerWithAuthOnlyReqMigration(cwd, settings) {
    const testingWithLatestCodebase = settings.testingWithLatestCodebase;
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['update', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateS3AddTriggerWithAuthOnlyReqMigration = updateS3AddTriggerWithAuthOnlyReqMigration;
function updateS3AddTriggerNewFunctionWithFunctionExisting(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['update', 'storage'], { cwd, stripColors: true })
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updateS3AddTriggerNewFunctionWithFunctionExisting = updateS3AddTriggerNewFunctionWithFunctionExisting;
function addS3StorageWithIdpAuth(projectDir) {
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd: projectDir, stripColors: true });
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
        chain.run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3StorageWithIdpAuth = addS3StorageWithIdpAuth;
function addS3Storage(projectDir) {
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd: projectDir, stripColors: true });
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3Storage = addS3Storage;
function addS3StorageWithAuthOnly(projectDir) {
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd: projectDir, stripColors: true });
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
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3StorageWithAuthOnly = addS3StorageWithAuthOnly;
function overrideS3(cwd) {
    return new Promise((resolve, reject) => {
        const args = ['override', 'storage'];
        (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true })
            .wait('Do you want to edit override.ts file now?')
            .sendConfirmNo()
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve({});
            }
            else {
                reject(err);
            }
        });
    });
}
exports.overrideS3 = overrideS3;
function addS3StorageWithSettings(projectDir, settings) {
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'storage'], { cwd: projectDir, stripColors: true });
        chain
            .wait('Select from one of the below mentioned services:')
            .send(' ') //'Content (Images, audio, video, etc.)'
            .sendCarriageReturn();
        chain
            .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
            .sendLine(settings.resourceName || __1.RETURN)
            .wait('Provide bucket name:')
            .sendLine(settings.bucketName || __1.RETURN);
        chain.wait('Who should have access:').sendKeyDown().send(' ').sendCarriageReturn();
        chain.wait('What kind of access do you want for Authenticated users?').selectAll();
        chain.wait('What kind of access do you want for Guest users?').selectAll();
        chain.wait('Do you want to add a Lambda Trigger for your S3 Bucket?').sendConfirmNo();
        chain.run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addS3StorageWithSettings = addS3StorageWithSettings;
//# sourceMappingURL=storage.js.map