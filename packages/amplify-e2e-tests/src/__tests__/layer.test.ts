import { initJSProjectWithProfile, deleteProject, amplifyPushAuth } from '../init';
import { addLayer, layerBuild } from '../categories/layer';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getLayer } from '../utils';

describe('amplify add layer', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add simple layer', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addLayer(projRoot, {});
    await layerBuild(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: layerArn, Region: region } = Object.keys(meta.layer).map(key => meta.layer[key])[0].output;
    expect(layerArn).toBeDefined();
    expect(region).toBeDefined();
    const layer = await getLayer(layerArn, region);
    expect(layer.LayerArn).toEqual(layerArn);
  });
});
