import * as path from 'path';

import { createNewProjectDir, deleteProjectDir } from 'amplify-e2e-core';

import { newPlugin, verifyPlugin } from '../plugin';

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
