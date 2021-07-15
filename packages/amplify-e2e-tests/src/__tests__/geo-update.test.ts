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
  updatePlaceIndexWithDefault,
  updateSecondMapAsDefault,
  updateSecondPlaceIndexAsDefault
} from 'amplify-e2e-core';
import { existsSync } from 'fs';
import path from 'path';
import uuid from 'uuid';
import { getAWSExports } from '../aws-exports/awsExports';

export function generateTwoResourceIdsInOrder(): string[] {
  const resourceIdArr: string[] = [];
  resourceIdArr.push(uuid().split('-')[0]);
  resourceIdArr.push(uuid().split('-')[0]);
  return resourceIdArr.sort();
}

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

  it('init a project with default auth config, add multiple map resources and update the default map', async () => {
    const [map1Id, map2Id] = generateTwoResourceIdsInOrder();
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addMapWithDefault(projRoot, { resourceName: map1Id });
    await addMapWithDefault(projRoot, { resourceName: map2Id, isAdditional: true, isDefault: false });
    await updateSecondMapAsDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    // //check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[map1Id].isDefault).toBe(false);
    expect(meta.geo[map2Id].isDefault).toBe(true);
    // //check if resource is provisioned in cloud
    const region = meta.providers.awscloudformation.Region;
    const map1 = await getMap(map1Id, region);
    const map2 = await getMap(map2Id, region);
    expect(map1.MapName).toBeDefined();
    expect(map2.MapName).toBeDefined();
    // //check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(awsExport.geo.maps.items[map1Id]).toBeDefined();
    expect(awsExport.geo.maps.items[map2Id]).toBeDefined();
    expect(awsExport.geo.maps.default).toEqual(map2Id);
  });

  it('init a project with default auth config, add multiple place index resources and update the default index', async () => {
    const [index1Id, index2Id] = generateTwoResourceIdsInOrder();
    await initJSProjectWithProfile(projRoot, {});
    await addAuthWithDefault(projRoot);
    await addPlaceIndexWithDefault(projRoot, { resourceName: index1Id });
    await addPlaceIndexWithDefault(projRoot, { resourceName: index2Id, isAdditional: true, isDefault: false });
    await updateSecondPlaceIndexAsDefault(projRoot);
    await amplifyPushWithoutCodegen(projRoot);

    // //check amplify meta file
    const meta = getProjectMeta(projRoot);
    expect(meta.geo[index1Id].isDefault).toBe(false);
    expect(meta.geo[index2Id].isDefault).toBe(true);
    // //check if resource is provisioned in cloud
    const region = meta.providers.awscloudformation.Region;
    const map1 = await getPlaceIndex(index1Id, region);
    const map2 = await getPlaceIndex(index2Id, region);
    expect(map1.IndexName).toBeDefined();
    expect(map2.IndexName).toBeDefined();
    // //check aws export file
    const awsExport: any = getAWSExports(projRoot).default;
    expect(awsExport.geo.place_indexes.items).toBeDefined();
    expect(awsExport.geo.place_indexes.default).toEqual(index2Id);
  });
})