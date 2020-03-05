import * as fs from 'fs-extra';
import * as path from 'path';

import { createNewProjectDir, deleteProjectDir, getEnvVars, getProjectMeta } from '../utils';

import { newPlugin, verifyPlugin, help, scan, listActive, listExcluded, listGeneralInfo } from '../plugin';

describe('amplify plugin', () => {
  let testDirPath: string;
  beforeEach(async () => {
    testDirPath = await createNewProjectDir('pluginTest');
  });

  afterEach(async () => {
    deleteProjectDir(testDirPath);
  });

  it('sets up new plugin package', async () => {
    const pluginDirName = await newPlugin(testDirPath);
    const pluginDirPath = path.join(testDirPath, pluginDirName);
    expect(verifyPlugin(pluginDirPath)).toBeTruthy();
  });
});
