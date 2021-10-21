import {
  addDDBWithTrigger,
  addSimpleDDB,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getDDBTable,
  getProjectMeta,
  initJSProjectWithProfile,
  updateDDBWithTrigger,
} from 'amplify-e2e-core';

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
