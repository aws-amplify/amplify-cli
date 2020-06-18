import {
  addLayer,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getLayerVersion,
  getProjectMeta,
  listVersions,
  removeLayer,
  updateLayer,
  validateLayerDir,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';

describe('amplify add lambda layer', () => {
  let projRoot: string;

  const validateMetadata = async function(layerName: string) {
    const meta = getProjectMeta(projRoot);

    const { Arn: Arn, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    const runtimes = Object.keys(meta.function).map(key => meta.function[key])[0].runtimes;
    const runtimeValue = Object.keys(runtimes).map(key => runtimes[key].cloudTemplateValue);
    const layerVersions = Object.keys(meta.function).map(key => meta.function[key])[0].versionsMap;
    const localVersions = Object.keys(layerVersions);

    expect(Arn).toBeDefined();
    expect(region).toBeDefined();
    const data = await getLayerVersion(Arn, region);
    const { LayerVersions: Versions } = await listVersions(layerName, region);
    const cloudVersions = Versions.map(version => version.Version);
    expect(cloudVersions.map(String).sort()).toEqual(localVersions.sort());
    expect(data.LayerVersionArn).toEqual(Arn);
    expect(data.CompatibleRuntimes).toEqual(runtimeValue);
  };

  beforeEach(async () => {
    projRoot = await createNewProjectDir('layers');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add simple layer', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      layerName: `simplelayer${shortId}`,
      runtimes: ['nodejs'],
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settings);
    expect(validateLayerDir(projRoot, settings.layerName, true)).toBeTruthy();
    await amplifyPushAuth(projRoot);
    await removeLayer(projRoot);
    expect(validateLayerDir(projRoot, settings.layerName, false)).toBeTruthy();
    await validateMetadata(settings.layerName);
  });

  it('init a project and add/update simple layer and push', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `testlayer${shortId}`;
    const settingsAdd = {
      runtimes: ['nodejs'],
      layerName: layerName,
    };
    const settingsUpdate = {
      runtimes: ['python'],
      layerName: layerName,
      versionChanged: true,
      numLayers: 1,
      isPushed: false,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settingsAdd);
    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);
    await validateMetadata(settingsUpdate.layerName);
  });

  it('init a project and add/push and update/push updating version', async () => {
    const [shortId] = uuid().split('-');
    const layerName = `testlayer${shortId}`;
    const settingsAdd = {
      runtimes: ['nodejs'],
      layerName: layerName,
    };
    const settingsUpdate = {
      runtimes: ['python'],
      layerName: layerName,
      versionChanged: true,
      numLayers: 1,
      isPushed: false,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settingsAdd);
    await amplifyPushAuth(projRoot);
    await updateLayer(projRoot, settingsUpdate);
    await amplifyPushAuth(projRoot);
    await validateMetadata(settingsUpdate.layerName);
  });

  it('init a project and add/push and update/push without updating version', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      runtimes: ['nodejs'],
      layerName: `testlayer${shortId}`,
      versionChanged: false,
      numLayers: 1,
      isPushed: false,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await updateLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validateMetadata(settings.layerName);
  });
});
