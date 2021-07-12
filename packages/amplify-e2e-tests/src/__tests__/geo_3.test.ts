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
  getMap,
  getPlaceIndex,
  removeMap,
  amplifyPushUpdate,
  removePlaceIndex
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';

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
})