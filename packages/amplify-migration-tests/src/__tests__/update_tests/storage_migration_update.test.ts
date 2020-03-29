import { initJSProjectWithProfile, deleteProject, amplifyPushAuth } from '../../../../amplify-e2e-tests/src/init';
import { addSimpleDDB, addDDBWithTrigger, updateDDBWithTrigger } from '../../../../amplify-e2e-tests/src/categories/storage';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getDDBTable } from '../../utils';

describe('amplify add/update storage(DDB)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('ddb-add-update migration');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add/update ddb table with & without trigger', async () => {
    // init, add storage and push with local cli
    await initJSProjectWithProfile(projRoot, { local: true });
    await addSimpleDDB(projRoot, { local: true });
    await addDDBWithTrigger(projRoot, { local: true });
    await amplifyPushAuth(projRoot, true);
    // update and push with codebase
    await updateDDBWithTrigger(projRoot, {});
    await amplifyPushAuth(projRoot);

    const meta = getProjectMeta(projRoot);
    const { Name: table1Name, Arn: table1Arn, Region: table1Region, StreamArn: table1StreamArn } = Object.keys(meta.storage).map(
      key => meta.storage[key],
    )[0].output;

    expect(table1Name).toBeDefined();
    expect(table1Arn).toBeDefined();
    expect(table1Region).toBeDefined();
    expect(table1StreamArn).toBeDefined();
    const table1Configs = await getDDBTable(table1Name, table1Region);

    expect(table1Configs.Table.TableArn).toEqual(table1Arn);

    const { Name: table2Name, Arn: table2Arn, Region: table2Region, StreamArn: table2StreamArn } = Object.keys(meta.storage).map(
      key => meta.storage[key],
    )[1].output;

    expect(table2Name).toBeDefined();
    expect(table2Arn).toBeDefined();
    expect(table2Region).toBeDefined();
    expect(table2StreamArn).toBeDefined();
    const table2Configs = await getDDBTable(table2Name, table2Region);
    expect(table2Configs.Table.TableArn).toEqual(table2Arn);
  });
});
