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
  getPlaceIndex
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';

describe('amplify geo add', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('amplify-geo-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project with default auth config and add the map resource', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'geotest' });
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const mapId = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'Map')[0];
    const region = meta.providers.awscloudformation.Region;
    const map = await getMap(mapId, region);
    expect(map.MapName).toBeDefined();
  });

  it('init a project with default auth config and add the place index resource', async () => {
    await initJSProjectWithProfile(projRoot, { name: 'geotest' });
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const placeIndexId = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'PlaceIndex')[0];
    const region = meta.providers.awscloudformation.Region;
    const placeIndex = await getPlaceIndex(placeIndexId, region);
    expect(placeIndex.IndexName).toBeDefined();
  });

})