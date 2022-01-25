import {
  addAuthWithDefault,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  amplifyPushWithoutCodegen,
  generateRandomShortId,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  getMap,
  getPlaceIndex
} from 'amplify-e2e-core';
import {
  addEnvironment,
  checkoutEnvironment,
  listEnvironment,
} from '../environment/env';


describe('environment commands with geo resources', () => {
  let projRoot: string;
  const map1Id = `map${generateRandomShortId()}`;
  const index1Id = `index${generateRandomShortId()}`;

  beforeAll(async () => {
    projRoot = await createNewProjectDir('env-test');
    //Add default auth, map and index in enva
    await initJSProjectWithProfile(projRoot, { envName: 'enva' });
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id, isDefault: true });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id, isDefault: true });
    await amplifyPushWithoutCodegen(projRoot);
    //Validate meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    expect(meta.geo[map1Id].isDefault).toBe(true);
    expect(meta.geo[index1Id].isDefault).toBe(true);
    //Validate provisioned resources
    const region = meta.geo[map1Id].output.Region;
    const map1Name = meta.geo[map1Id].output.Name;
    const index1Name = meta.geo[index1Id].output.Name;
    const map1 = await getMap(map1Name, region);
    const index1 = await getPlaceIndex(index1Name, region);
    expect(map1.MapName).toBeDefined();
    expect(index1.IndexName).toBeDefined();
    //Initialize new envb and add default auth
    await addEnvironment(projRoot, { envName: 'envb' });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: 'envb', restoreBackend: true });
    await addAuthWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
  });

  afterAll(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
  it('should generate correct meta file in the original environment', async () => {
    await checkoutEnvironment(projRoot, { envName: 'enva', restoreBackend: true });
    //Validate meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    expect(meta.geo[map1Id].isDefault).toBe(true);
    expect(meta.geo[index1Id].isDefault).toBe(true);
    //Validate provisioned resources
    const region = meta.geo[map1Id].output.Region;
    const map1Name = meta.geo[map1Id].output.Name;
    const index1Name = meta.geo[index1Id].output.Name;
    const map1 = await getMap(map1Name, region);
    const index1 = await getPlaceIndex(index1Name, region);
    expect(map1.MapName).toBeDefined();
    expect(index1.IndexName).toBeDefined();
  });
  it('should generate correct meta file after adding a new map in new environment', async () => {
    await checkoutEnvironment(projRoot, { envName: 'envb', restoreBackend: true });
    const map2Id = `map${generateRandomShortId()}`;
    await addMapWithDefault(projRoot, { resourceName: map2Id, isDefault: true });
    await amplifyPushWithoutCodegen(projRoot);
    //Validate meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    expect(meta.geo[map2Id].isDefault).toBe(true);
    //Validate provisioned resources
    const region = meta.geo[map2Id].output.Region;
    const map2Name = meta.geo[map2Id].output.Name;
    const map2 = await getMap(map2Name, region);
    expect(map2.MapName).toBeDefined();
  });

  it('should generate correct meta file after adding a new index in new environment', async () => {
    await checkoutEnvironment(projRoot, { envName: 'envb', restoreBackend: true });
    const index2Id = `index${generateRandomShortId()}`;
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isDefault: true });
    await amplifyPushWithoutCodegen(projRoot);
    //Validate meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo).toBeDefined();
    expect(meta.geo[index2Id].isDefault).toBe(true);
    //Validate provisioned resources
    const region = meta.geo[index2Id].output.Region;
    const index2Name = meta.geo[index2Id].output.Name;
    const index2 = await getPlaceIndex(index2Name, region);
    expect(index2.IndexName).toBeDefined();
  });
});