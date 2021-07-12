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
  updateMapWithDefault,
  updatePlaceIndexWithDefault
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';

describe('amplify geo update', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-update-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project with default auth config, add the map resource and update the auth config', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot);
    await updateMapWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const geoMeta = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'Map').map(key => meta.geo[key])[0]
    const mapId = geoMeta.output.Name;
    const region = meta.providers.awscloudformation.Region;
    const map = await getMap(mapId, region);
    expect(map.MapName).toBeDefined();
    expect(geoMeta.accessType).toBe('AuthorizedAndGuestUsers')
  });

  it('init a project with default auth config, add the place index resource and update the auth config', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot);
    await updatePlaceIndexWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const geoMeta = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'PlaceIndex').map(key => meta.geo[key])[0]
    const placeIndexId = geoMeta.output.Name;
    const region = meta.providers.awscloudformation.Region;
    const placeIndex = await getPlaceIndex(placeIndexId, region);
    expect(placeIndex.IndexName).toBeDefined();
    expect(geoMeta.accessType).toBe('AuthorizedAndGuestUsers')
  });
})