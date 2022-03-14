import { existsSync } from "fs-extra";
import path from "path";
import { addAuthWithDefault, addHeadlessGeo, amplifyPushAuth, createNewProjectDir, deleteProject, deleteProjectDir, getMap, getProjectMeta, initJSProjectWithProfile, updateHeadlessGeo, removeHeadlessGeo } from "amplify-e2e-core";
import { AccessType, AddGeoRequest, MapStyle, UpdateGeoRequest, RemoveGeoRequest } from "amplify-headless-interface";
import { v4 as uuid } from 'uuid';

describe('Geo headless tests', () => {
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
  describe('map tests', () => {
    it('should init a project with default auth and add/update/remove geo map headlessly', async () => {
      const [shortId1] = uuid().split('-');
      const [shortId2] = uuid().split('-');
      const mapId1 = `map${shortId1}`;
      const mapId2 = `map${shortId2}`;
      const addGeoRequest1: AddGeoRequest = {
        version: 1,
        serviceConfiguration: {
          serviceName: "Map",
          name: mapId1,
          accessType: AccessType.AuthorizedUsers,
          mapStyle: MapStyle.VectorEsriDarkGrayCanvas,
          setAsDefault: true
        }
      };
      const addGeoRequest2: AddGeoRequest = {
        version: 1,
        serviceConfiguration: {
          serviceName: "Map",
          name: mapId2,
          accessType: AccessType.AuthorizedUsers,
          mapStyle: MapStyle.VectorEsriDarkGrayCanvas,
          setAsDefault: false
        }
      };
      const updateGeoRequest: UpdateGeoRequest = {
        version: 1,
        serviceModification: {
          serviceName:"Map",
          name: mapId1,
          accessType: AccessType.AuthorizedAndGuestUsers,
          setAsDefault: true
        }
      };
      const removeGeoRequest: RemoveGeoRequest = {
        version: 1,
        serviceRemoval: {
          serviceName: "Map",
          name: mapId1
        }
      };
      await initJSProjectWithProfile(projRoot, {});
      await addAuthWithDefault(projRoot);
      //add map
      await addHeadlessGeo(projRoot, addGeoRequest1);
      await addHeadlessGeo(projRoot, addGeoRequest2);
      await amplifyPushAuth(projRoot);
      let meta = getProjectMeta(projRoot);
      const { Name: name, Region: region } = Object.keys(meta.geo).map(key => meta.geo[key])[0].output;
      expect(name).toBeDefined();
      expect(region).toBeDefined();
      const { MapName: mapName } = await getMap(name, region);
      expect(mapName).toBeDefined();
      //update map
      await updateHeadlessGeo(projRoot, updateGeoRequest);
      await amplifyPushAuth(projRoot);
      meta = getProjectMeta(projRoot);
      expect(meta.geo[mapId1].accessType).toBe('AuthorizedAndGuestUsers');
      //remove map
      await removeHeadlessGeo(projRoot, removeGeoRequest);
      await amplifyPushAuth(projRoot);
      meta = getProjectMeta(projRoot);
      expect(meta.geo[mapId1]).toBeUndefined();
      expect(meta.geo[mapId2].isDefault).toBe(true);
    });
  })
});