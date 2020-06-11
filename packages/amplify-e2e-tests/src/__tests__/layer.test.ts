import {
  addLayer,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getFunction,
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

  const validateMetadata = async function() {
    const meta = getProjectMeta(projRoot);

    const { Arn: Arn, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    const runtimes = Object.keys(meta.function).map(key => meta.function[key])[0].runtimes;
    const runtimeValue = Object.keys(runtimes).map(key => runtimes[key].cloudTemplateValue);
    const layerVersions = Object.keys(meta.function).map(key => meta.function[key])[0].versionsMap;
    const localVersions = Object.keys(layerVersions);

    expect(Arn).toBeDefined();
    expect(region).toBeDefined();
    const data = await getLayerVersion(Arn, region);
    const { LayerVersions: Versions } = await listVersions(`${settings.layerName}-integtest`, region);
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
    const layerName = 'simplelayer';
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, { layerName });
    expect(validateLayerDir(projRoot, layerName, true)).toBeTruthy();
    await removeLayer(projRoot);
    expect(validateLayerDir(projRoot, layerName, false)).toBeTruthy();
  });

  it('init a project and add/update simple layer and push', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      layerName: `testlayer${shortId}`,
      versionChanged: true,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settings);
    await updateLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validateMetadata();
  });

  it('init a project and add/push and update/push updating version', async () => {
    const [shortId] = uuid().split('-');
    const settings = {
      layerName: `testlayer${shortId}`,
      versionChanged: true,
    };
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await updateLayer(projRoot, settings);
    await amplifyPushAuth(projRoot);
    await validateMetadata();
  });
});
