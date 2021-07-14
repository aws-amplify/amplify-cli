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
import uuid from 'uuid';
import { existsSync } from 'fs';
import path from 'path';
import { getAWSExports } from '../aws-exports/awsExports';

function generateRandomShortId(): string {
  return uuid().split('-')[0];
}

describe('amplify geo add', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('geo-add-test');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a project with default auth config and add the map resource', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const mapId = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'Map')[0];
    const region = meta.providers.awscloudformation.Region;
    const map = await getMap(mapId, region);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(map.MapName).toBeDefined();
    expect(awsExport.geo.maps.items).toBeDefined();
  });

  it('init a project with default auth config and add the place index resource', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    const meta = getProjectMeta(projRoot);
    const placeIndexId = Object.keys(meta.geo).filter(key => meta.geo[key].service === 'PlaceIndex')[0];
    const region = meta.providers.awscloudformation.Region;
    const placeIndex = await getPlaceIndex(placeIndexId, region);
    const awsExport: any = getAWSExports(projRoot).default;
    expect(placeIndex.IndexName).toBeDefined();
  });

  it.only('init a project with default auth config and add two map resources with the second set to default', async () => {
    const map1Id = `map${generateRandomShortId}`;
    const map2Id = `map${generateRandomShortId}`;
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true });
    await amplifyPushWithoutCodegen(projRoot);

    //check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[map1Id].isDefault).toBe(false);
    expect(meta.geo[map2Id].isDefault).toBe(true);
    //check if resource is provisioned in cloud
    const region = meta.providers.awscloudformation.Region;
    const map1 = await getMap(map1Id, region);
    const map2 = await getMap(map2Id, region);
    expect(map1.MapName).toBeDefined();
    expect(map2.MapName).toBeDefined();
    //check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(awsExport.geo.maps.items[map1Id]).toBeDefined();
    expect(awsExport.geo.maps.items[map2Id]).toBeDefined();
  });

  it('init a project with default auth config and add two map resources with the second set to default', async () => {

  });
})