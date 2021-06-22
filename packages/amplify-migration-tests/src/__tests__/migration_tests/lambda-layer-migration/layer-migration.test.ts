import {
  amplifyPushAuth,
  amplifyPushLayer,
  amplifyStatus,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectConfig,
  initJSProjectWithProfile,
  LayerRuntime,
  LayerPermissionChoice,
  removeLayerVersion,
  updateLayer,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import {
  initJSProjectWithProfileOldDX,
  legacyAddLayer,
  legacyAddOptData,
  validateLayerConfigFilesMigrated,
  versionCheck,
} from '../../../migration-helpers';

describe('test lambda layer migration flow introduced in v5.0.0', () => {
  let projRoot: string;
  let versionToMigrateFrom: string;

  beforeAll(async () => {
    const version = { v: 'unintialized' };
    await versionCheck(process.cwd(), false, version);
    versionToMigrateFrom = version.v;
  });

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
    if (versionToMigrateFrom === '4.28.2') {
      await initJSProjectWithProfileOldDX(projRoot, {}, false);
    } else if (versionToMigrateFrom === '4.52.0') {
      await initJSProjectWithProfile(projRoot, {});
    } else {
      throw new Error(`layer-migration.test.ts was invoked with an unexpected installed Amplify CLI version: ${versionToMigrateFrom}`);
    }
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('migrate layer in No Change state with "amplify update function", then push a new vesion after migration', async () => {
    const accountId = process.env.LAYERS_AWS_ACCOUNT_ID;
    const orgId = process.env.LAYERS_AWS_ORG_ID;

    if (!accountId || !orgId) {
      throw new Error('One or both env vars are not set: LAYERS_AWS_ACCOUNT_ID, LAYERS_AWS_ORG_ID');
    }

    const { projectName: projName } = getProjectConfig(projRoot);
    const [shortId] = uuid().split('-');
    const layerName = `test${shortId}`;
    const layerRuntime: LayerRuntime = 'nodejs';
    const layerSettings = {
      layerName,
      permissions: ['Specific AWS accounts', 'Specific AWS organization'] as LayerPermissionChoice[],
      accountId,
      orgId,
      projName,
      runtimes: [layerRuntime],
    };

    await legacyAddLayer(projRoot, layerSettings);
    await amplifyPushAuth(projRoot, false);
    await amplifyStatus(projRoot, 'No Change', true);
    await updateLayer(projRoot, { ...layerSettings, dontChangePermissions: true, migrateLegacyLayer: true }, true);
    await amplifyStatus(projRoot, 'Update', true);
    expect(validateLayerConfigFilesMigrated(projRoot, layerName)).toBe(true);
    await amplifyPushLayer(projRoot, {}, true);
    await removeLayerVersion(projRoot, { removeLegacyOnly: true }, [1], [1, 2], true);
    legacyAddOptData(projRoot, layerName);
    await amplifyPushLayer(projRoot, {}, true);
    await amplifyStatus(projRoot, 'No Change', true);
  });

  it('migrate layer in Create state with "amplify push"', async () => {
    const { projectName: projName } = getProjectConfig(projRoot);
    const [shortId] = uuid().split('-');
    const layerName = `test${shortId}`;
    const layerRuntime: LayerRuntime = 'nodejs';
    const layerSettings = {
      layerName,
      projName,
      runtimes: [layerRuntime],
    };

    await legacyAddLayer(projRoot, layerSettings);
    await amplifyPushLayer(projRoot, { migrateLegacyLayer: true }, true);
    expect(validateLayerConfigFilesMigrated(projRoot, layerName)).toBe(true);
  });

  it('migrate layer in Update state with "amplify push"', async () => {
    const { projectName: projName } = getProjectConfig(projRoot);
    const [shortId] = uuid().split('-');
    const layerName = `test${shortId}`;
    const layerRuntime: LayerRuntime = 'nodejs';
    const layerSettings = {
      layerName,
      projName,
      runtimes: [layerRuntime],
    };

    await legacyAddLayer(projRoot, layerSettings);
    await amplifyPushAuth(projRoot, false);
    legacyAddOptData(projRoot, layerName);
    await amplifyPushLayer(projRoot, { migrateLegacyLayer: true }, true);
    await removeLayerVersion(projRoot, { removeLegacyOnly: true }, [1], [1, 2], true);
    expect(validateLayerConfigFilesMigrated(projRoot, layerName)).toBe(true);
  });

  it('migrate layer in No Change state with "amplify update function" by updating permissions', async () => {
    const { projectName: projName } = getProjectConfig(projRoot);
    const [shortId] = uuid().split('-');
    const layerName = `test${shortId}`;
    const layerRuntime: LayerRuntime = 'nodejs';
    const layerSettings = {
      layerName,
      projName,
      runtimes: [layerRuntime],
    };

    await legacyAddLayer(projRoot, layerSettings);
    await amplifyPushAuth(projRoot, false);
    await updateLayer(
      projRoot,
      {
        ...layerSettings,
        projName: '',
        changePermissionOnLatestVersion: true,
        migrateLegacyLayer: true,
        permissions: ['Public (Anyone on AWS can use this layer)'] as LayerPermissionChoice[],
      },
      true,
    );
    await amplifyPushLayer(projRoot, {}, true);
    await removeLayerVersion(projRoot, { removeLegacyOnly: true }, [1], [1, 2], true);
    expect(validateLayerConfigFilesMigrated(projRoot, layerName)).toBe(true);
  });
});
