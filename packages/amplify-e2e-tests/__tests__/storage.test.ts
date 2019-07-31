require('../src/aws-matchers/'); // custom matcher for assertion
import { initProjectWithProfile, deleteProject, amplifyPushAuth } from '../src/init';
import { addAuthWithDefault } from '../src/categories/auth';
import { addSimpleDDB, addDDBWithTrigger, updateDDBWithTrigger, addS3WithTrigger } from '../src/categories/storage';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getDDBTable, checkIfBucketExists } from '../src/utils';


describe('amplify add/update storage(S3)', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add S3 bucket with trigger', async () => {
    await initProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot, {});
    await addS3WithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const { BucketName: bucketName, Region: region } = Object.keys(
      meta.storage
    ).map(key => meta.storage[key])[0].output;

    expect(bucketName).toBeDefined();
    expect(region).toBeDefined();

    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});

  });
});

describe('amplify add/update storage(DDB)', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add/update ddb table with & without trigger', async () => {
    await initProjectWithProfile(projRoot, {});
    await addSimpleDDB(projRoot, {});
    await addDDBWithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);
    await updateDDBWithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const { Name: table1Name, Arn: table1Arn, Region: table1Region, StreamArn: table1StreamArn } = Object.keys(
      meta.storage
    ).map(key => meta.storage[key])[0].output;

    expect(table1Name).toBeDefined();
    expect(table1Arn).toBeDefined();
    expect(table1Region).toBeDefined();
    expect(table1StreamArn).toBeDefined()
    const table1Configs = await getDDBTable(table1Name, table1Region);

    expect(table1Configs.Table.TableArn).toEqual(table1Arn);

    const { Name: table2Name, Arn: table2Arn, Region: table2Region, StreamArn: table2StreamArn } = Object.keys(
      meta.storage
    ).map(key => meta.storage[key])[1].output;

    expect(table2Name).toBeDefined();
    expect(table2Arn).toBeDefined();
    expect(table2Region).toBeDefined();
    expect(table2StreamArn).toBeDefined()
    const table2Configs = await getDDBTable(table2Name, table2Region);
    expect(table2Configs.Table.TableArn).toEqual(table2Arn);

  });
});
