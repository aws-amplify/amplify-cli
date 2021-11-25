import { $TSObject } from 'amplify-cli-core';
import {
  addAuthWithDefault,
  addDDBWithTrigger,
  addS3StorageWithAuthOnly,
  addSimpleDDB,
  amplifyPushAuth,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getDDBTable,
  getProjectMeta,
  updateDDBWithTriggerMigration,
  updateS3AddTriggerWithAuthOnlyReqMigration,
} from 'amplify-e2e-core';
import { initJSProjectWithProfile, versionCheck, allowedVersionsToMigrateFrom } from '../../migration-helpers';

describe('amplify add/update storage(DDB)', () => {
  let projRoot: string;

  beforeAll(async () => {
    const migrateFromVersion = { v: 'unintialized' };
    const migrateToVersion = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, migrateFromVersion);
    await versionCheck(process.cwd(), true, migrateToVersion);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
  });
  beforeEach(async () => {
    projRoot = await createNewProjectDir('ddb-add-update migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot, undefined, true);
    deleteProjectDir(projRoot);
  });

  it('init a project and add/update ddb table with & without trigger', async () => {
    // init, add storage and push with local cli
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addSimpleDDB(projRoot, {});
    await addDDBWithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    // update and push with codebase
    await updateDDBWithTriggerMigration(projRoot, { testingWithLatestCodebase: true });
    await amplifyPushAuth(projRoot, true);

    const meta = getProjectMeta(projRoot);
    const {
      Name: table1Name,
      Arn: table1Arn,
      Region: table1Region,
      StreamArn: table1StreamArn,
    } = Object.keys(meta.storage).map(key => meta.storage[key])[0].output;

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
    } = Object.keys(meta.storage).map(key => meta.storage[key])[1].output;

    expect(table2Name).toBeDefined();
    expect(table2Arn).toBeDefined();
    expect(table2Region).toBeDefined();
    expect(table2StreamArn).toBeDefined();
    const table2Configs = await getDDBTable(table2Name, table2Region);
    expect(table2Configs.Table.TableArn).toEqual(table2Arn);
  });
});

function getPluginServiceMetaFromAmplifyMeta(amplifyMeta: $TSObject, pluginServiceName: string): $TSObject {
  for (const resourceName of Object.keys(amplifyMeta.storage)) {
    if (amplifyMeta.storage[resourceName].service === pluginServiceName) {
      return amplifyMeta.storage[resourceName];
    }
  }
  throw new Error(`${pluginServiceName} Resource not found in meta-file`);
}

function getPluginDependsOnFromResourceMeta(resourceMeta: $TSObject, dependencyCategory: string) {
  for (const dependentResource of resourceMeta.dependsOn) {
    if (dependentResource.category === dependencyCategory) {
      return dependentResource;
    }
  }
  throw new Error(`${resourceMeta.providerMetadata.logicalId} has no dependsOn of ${dependencyCategory}`);
}

describe('amplify add/update storage(S3)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('s3-add-update migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot, undefined, true);
    deleteProjectDir(projRoot);
  });

  it('init a project and add s3 bucket & update with new trigger', async () => {
    // init, add storage and push with local cli
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3StorageWithAuthOnly(projRoot);
    await amplifyPushAuth(projRoot);
    // update and push with new codebase
    await updateS3AddTriggerWithAuthOnlyReqMigration(projRoot, { testingWithLatestCodebase: true });
    await amplifyPushAuth(projRoot, true /*latest codebase*/);

    const meta = getProjectMeta(projRoot);
    const s3Meta = getPluginServiceMetaFromAmplifyMeta(meta, 'S3');
    const output = s3Meta.output;
    expect(output.BucketName).toBeDefined();
    expect(output.Region).toBeDefined();

    const bucketExists = await checkIfBucketExists(output.BucketName, output.Region);
    expect(bucketExists).toMatchObject({});
    const dependsOnFunctionMeta = getPluginDependsOnFromResourceMeta(s3Meta, 'function');
    expect(dependsOnFunctionMeta.resourceName).toBeDefined();
  });
});
