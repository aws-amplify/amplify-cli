import { $TSAny, $TSObject, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import {
  addAuthWithDefault,
  addDDBWithTrigger,
  addS3WithGuestAccess,
  addSimpleDDB,
  addSimpleDDBwithGSI,
  amplifyPushAuth,
  buildOverrideStorage,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getDDBTable,
  getProjectMeta,
  initJSProjectWithProfile,
  overrideDDB,
  overrideS3,
  replaceOverrideFileWithProjectInfo,
  updateDDBWithTrigger,
  updateSimpleDDBwithGSI,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as uuid from 'uuid';

function getServiceMeta(projectRoot: string, category: string, service: string): $TSAny {
  const meta = getProjectMeta(projectRoot);
  for (const storageResourceName of Object.keys(meta[category])) {
    if (meta.storage[storageResourceName].service.toUpperCase() === service.toUpperCase()) {
      return meta.storage[storageResourceName];
    }
  }
  return undefined;
}

describe('s3 override tests', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('s3-overrides');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('override S3 Removal property', async () => {
    const projectName = 's3OverrideTest';
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addAuthWithDefault(projRoot);
    await addS3WithGuestAccess(projRoot);
    await overrideS3(projRoot);

    const resourcePath = path.join(projRoot, 'amplify', 'backend', 'storage');
    const resourceName = fs.readdirSync(resourcePath)[0];

    // this is where we will write overrides to
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'storage', resourceName, 'override.ts');

    // test override file in compilation error state
    const srcInvalidOverrideCompileError = path.join(__dirname, '..', '..', 'overrides', 'override-compile-error.txt');
    fs.copyFileSync(srcInvalidOverrideCompileError, destOverrideFilePath);
    await expect(amplifyPushAuth(projRoot)).rejects.toThrowError();

    // test override file in runtime error state
    const srcInvalidOverrideRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-runtime-error.txt');
    fs.copyFileSync(srcInvalidOverrideRuntimeError, destOverrideFilePath);
    await expect(amplifyPushAuth(projRoot)).rejects.toThrowError();

    // test happy path
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-storage-s3.ts');
    const cfnFilePath = path.join(projRoot, 'amplify', 'backend', 'storage', resourceName, 'build', 'cloudformation-template.json');
    replaceOverrideFileWithProjectInfo(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
    await buildOverrideStorage(projRoot);
    let s3CFNFileJSON = JSONUtilities.readJson<$TSObject>(cfnFilePath);
    // check if overrides are applied to the cfn file
    expect(s3CFNFileJSON?.Resources?.S3Bucket?.Properties?.VersioningConfiguration?.Status).toEqual('Enabled');

    // check if override persists after an update
    s3CFNFileJSON = JSONUtilities.readJson(cfnFilePath);
    expect(s3CFNFileJSON?.Resources?.S3Bucket?.Properties?.VersioningConfiguration?.Status).toEqual('Enabled');

    await amplifyPushAuth(projRoot);
    const s3Meta = getServiceMeta(projRoot, 'storage', 'S3');
    const { BucketName: bucketName, Region: region } = s3Meta.output;

    expect(region).toBeDefined();
    expect(bucketName).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});
  });
});

describe('amplify add/update storage(DDB) with GSI', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('ddb-gsi');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project add a GSI and then update with another GSI', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addSimpleDDBwithGSI(projRoot);
    await updateSimpleDDBwithGSI(projRoot);
    await amplifyPushAuth(projRoot);
  });
});

describe('amplify add/update storage(DDB)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('ddb-add-update');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add/update ddb table with & without trigger', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addSimpleDDB(projRoot, {});
    await addDDBWithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    await updateDDBWithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const {
      Name: table1Name,
      Arn: table1Arn,
      Region: table1Region,
      StreamArn: table1StreamArn,
    } = Object.keys(meta.storage).map((key) => meta.storage[key])[0].output;

    expect(table1Name).toBeDefined();
    expect(table1Arn).toBeDefined();
    expect(table1Region).toBeDefined();
    expect(table1StreamArn).toBeDefined();
    const table1Configs = await getDDBTable(table1Name, table1Region);

    expect(table1Configs.Table.TableArn).toEqual(table1Arn);

    const {
      Name: table2Name,
      Arn: table2Arn,
      Region: table2Region,
      StreamArn: table2StreamArn,
    } = Object.keys(meta.storage).map((key) => meta.storage[key])[1].output;

    expect(table2Name).toBeDefined();
    expect(table2Arn).toBeDefined();
    expect(table2Region).toBeDefined();
    expect(table2StreamArn).toBeDefined();
    const table2Configs = await getDDBTable(table2Name, table2Region);
    expect(table2Configs.Table.TableArn).toEqual(table2Arn);
  });
});

describe('ddb override tests', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('ddb-overrides');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('override DDB StreamSpecification property', async () => {
    const resourceName = `dynamo${uuid.v4().split('-')[0]}`;
    const projectName = 'ddbOverrideTest';
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addSimpleDDB(projRoot, { name: resourceName });
    await overrideDDB(projRoot);

    // this is where we will write our override logic to
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'storage', resourceName, 'override.ts');

    // build overrides should throw an error if there are compilation errors in override file
    const srcInvalidOverrideCompileError = path.join(__dirname, '..', '..', 'overrides', 'override-compile-error.txt');
    fs.copyFileSync(srcInvalidOverrideCompileError, destOverrideFilePath);
    await expect(buildOverrideStorage(projRoot)).rejects.toThrowError();
    await expect(amplifyPushAuth(projRoot)).rejects.toThrowError();

    // build overrides should throw an error if there are runtime errors in override file
    const srcInvalidOverrideRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-runtime-error.txt');
    fs.copyFileSync(srcInvalidOverrideRuntimeError, destOverrideFilePath);
    await expect(buildOverrideStorage(projRoot)).rejects.toThrowError();
    await expect(amplifyPushAuth(projRoot)).rejects.toThrowError();

    // test happy path
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-storage-ddb.ts');
    const cfnFilePath = path.join(
      projRoot,
      'amplify',
      'backend',
      'storage',
      resourceName,
      'build',
      `${resourceName}-cloudformation-template.json`,
    );

    replaceOverrideFileWithProjectInfo(srcOverrideFilePath, destOverrideFilePath, 'integtest', projectName);
    // should throw error if AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES is set
    await expect(buildOverrideStorage(projRoot, { AMPLIFY_CLI_DISABLE_SCRIPTING_FEATURES: 'true' })).rejects.toThrowError();
    // should succeed now
    await buildOverrideStorage(projRoot);
    let ddbCFNFileJSON = JSONUtilities.readJson<$TSObject>(cfnFilePath);
    // check if overrides are applied to the cfn file
    expect(ddbCFNFileJSON?.Resources?.DynamoDBTable?.Properties?.StreamSpecification?.StreamViewType).toEqual('NEW_AND_OLD_IMAGES');
    await updateDDBWithTrigger(projRoot, {});

    // check if override persists after an update
    ddbCFNFileJSON = JSONUtilities.readJson(cfnFilePath);
    expect(ddbCFNFileJSON?.Resources?.DynamoDBTable?.Properties?.StreamSpecification?.StreamViewType).toEqual('NEW_AND_OLD_IMAGES');
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const {
      Name: table1Name,
      Arn: table1Arn,
      Region: table1Region,
      StreamArn: table1StreamArn,
    } = Object.keys(meta.storage).map((key) => meta.storage[key])[0].output;

    expect(table1Name).toBeDefined();
    expect(table1Arn).toBeDefined();
    expect(table1Region).toBeDefined();
    expect(table1StreamArn).toBeDefined();
    const table1Configs = await getDDBTable(table1Name, table1Region);
    expect(table1Configs.Table.TableArn).toEqual(table1Arn);
  });
});
