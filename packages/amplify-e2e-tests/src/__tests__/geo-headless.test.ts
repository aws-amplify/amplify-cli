import { existsSync } from "fs-extra";
import path from "path";
import { addAuthWithDefault, addHeadlessGeo, amplifyPushAuth, createNewProjectDir, deleteProject, deleteProjectDir, getMap, getProjectMeta, initJSProjectWithProfile, updateHeadlessGeo } from "amplify-e2e-core";
import { AccessType, AddGeoRequest, MapStyle, UpdateGeoRequest } from "amplify-headless-interface";
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
    it('should init a project with default auth and add/update geo map headlessly', async () => {
      const [shortId] = uuid().split('-');
      const mapId = `map${shortId}`;
      const addGeoRequest: AddGeoRequest = {
        version: 1,
        serviceConfiguration: {
          serviceName: "Map",
          name: mapId,
          accessType: AccessType.AuthorizedUsers,
          mapStyle: MapStyle.VectorEsriDarkGrayCanvas,
          setAsDefault: true
        }
      };
      const updateGeoRequest: UpdateGeoRequest = {
        version: 1,
        serviceModification: {
          serviceName:"Map",
          name: mapId,
          accessType: AccessType.AuthorizedAndGuestUsers,
          setAsDefault: true
        }
      };
      await initJSProjectWithProfile(projRoot, {});
      await addAuthWithDefault(projRoot);
      await addHeadlessGeo(projRoot, addGeoRequest);
      await amplifyPushAuth(projRoot);

      const meta = getProjectMeta(projRoot);
      const { Name: name, Region: region } = Object.keys(meta.geo).map(key => meta.geo[key])[0].output;
      expect(name).toBeDefined();
      expect(region).toBeDefined();
      const { MapName: mapName } = await getMap(name, region);
      expect(mapName).toBeDefined();
      await updateHeadlessGeo(projRoot, updateGeoRequest);
      await amplifyPushAuth(projRoot);
      const newMeta = getProjectMeta(projRoot);
      expect(newMeta.geo[mapId].accessType).toBe('AuthorizedAndGuestUsers');
    });
  })
});