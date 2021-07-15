import { 
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  addMapWithDefault,
  addPlaceIndexWithDefault,
  getProjectMeta,
  amplifyPushWithoutCodegen,
  removeMap,
  amplifyPushUpdate,
  removePlaceIndex,
  removeFirstDefaultMap,
  removeFirstDefaultPlaceIndex
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import { generateTwoResourceIdsInOrder } from './geo-update.test';

describe('amplify geo remove', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-remove-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project with default auth config and the map resource, then remove the map', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    const mapId = Object.keys(oldMeta.geo).filter(key => oldMeta.geo[key].service === 'Map')[0];
    //remove map
    await removeMap(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[mapId]).toBeUndefined();
  });

  it('init a project with default auth config and the place index resource, then remove the place index', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    const placeIndexId = Object.keys(oldMeta.geo).filter(key => oldMeta.geo[key].service === 'PlaceIndex')[0];
    //remove place index
    await removePlaceIndex(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[placeIndexId]).toBeUndefined();
  });

  it('init a project with default auth config and two map resources, then remove the default map', async () => {
    const [map1Id, map2Id] = generateTwoResourceIdsInOrder();
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true, isDefault: false })
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    expect(oldMeta.geo[map1Id].isDefault).toBe(true);
    expect(oldMeta.geo[map2Id].isDefault).toBe(false);
    //remove map
    await removeFirstDefaultMap(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[map1Id]).toBeUndefined();
    expect(newMeta.geo[map2Id].isDefault).toBe(true);
  });

  it('init a project with default auth config and two index resources, then remove the default index', async () => {
    const [index1Id, index2Id] = generateTwoResourceIdsInOrder();
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isAdditional: true, isDefault: false })
    await amplifyPushWithoutCodegen(projRoot);
    const oldMeta = getProjectMeta(projRoot);
    expect(oldMeta.geo[index1Id].isDefault).toBe(true);
    expect(oldMeta.geo[index2Id].isDefault).toBe(false);
    //remove map
    await removeFirstDefaultPlaceIndex(projRoot);
    await amplifyPushUpdate(projRoot);
    const newMeta = getProjectMeta(projRoot);
    expect(newMeta.geo[index1Id]).toBeUndefined();
    expect(newMeta.geo[index2Id].isDefault).toBe(true);
  });
})