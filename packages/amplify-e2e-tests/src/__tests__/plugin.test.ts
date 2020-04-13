import * as fs from 'fs-extra';
import * as path from 'path';

import { createNewProjectDir, deleteProjectDir } from '../utils';

import * as plugin from '../plugin';

describe('amplify plugin', () => {
  let testDirPath: string;
  beforeEach(async () => {
    testDirPath = await createNewProjectDir('plugin');
    testDirPath = fs.realpathSync(testDirPath);
  });

  afterEach(async () => {
    deleteProjectDir(testDirPath);
  });

  it('help, scan and list', async () => {
    await plugin.help(testDirPath);
    await plugin.scan(testDirPath);
    await plugin.listActive(testDirPath);
    await plugin.listExcluded(testDirPath);
    await plugin.listGeneralInfo(testDirPath);
    expect(plugin.verifyPluginPlatformSetup()).toBeTruthy();
  });

  it('create new plugin package, add and remove', async () => {
    const pluginDirName = await plugin.newPlugin(testDirPath);
    const pluginDirPath = path.resolve(testDirPath, pluginDirName);
    expect(plugin.verifyPlugin(pluginDirPath)).toBeTruthy();
    expect(plugin.verifyCustomPluginAdded(pluginDirPath)).toBeTruthy();
    await plugin.removeCustomPlugin(testDirPath, pluginDirPath);
    expect(plugin.verifyCustomPluginAdded(pluginDirPath)).toBeFalsy();
    await plugin.addCustomPlugin(testDirPath, pluginDirPath);
    expect(plugin.verifyCustomPluginAdded(pluginDirPath)).toBeTruthy();
    await plugin.removeCustomPlugin(testDirPath, pluginDirPath);
    expect(plugin.verifyCustomPluginAdded(pluginDirPath)).toBeFalsy();
  });

  it('configure plugin scannable directory', async () => {
    const pluginScanDirName = 'mockPluginScanDir';
    const pluginScanDirPathFull = path.resolve(testDirPath, pluginScanDirName);
    const pluginScanDirPathRelative = path.join('.', pluginScanDirName);
    fs.ensureDirSync(pluginScanDirPathFull);

    await plugin.addPlugDirectory(testDirPath, pluginScanDirPathFull);
    expect(plugin.verifyPluginDirectoryAdded(pluginScanDirPathFull)).toBeTruthy();
    await plugin.removePlugDirectory(testDirPath, pluginScanDirPathFull);
    expect(plugin.verifyPluginDirectoryAdded(pluginScanDirPathFull)).toBeFalsy();

    await plugin.addPlugDirectory(testDirPath, pluginScanDirPathRelative);
    expect(plugin.verifyPluginDirectoryAdded(pluginScanDirPathFull)).toBeTruthy();
    await plugin.removePlugDirectory(testDirPath, pluginScanDirPathFull);
    expect(plugin.verifyPluginDirectoryAdded(pluginScanDirPathFull)).toBeFalsy();
  });

  it('configure plugin scannable prefix', async () => {
    const pluginPrefix = 'mockpluginprefix-';
    await plugin.addPlugPrefix(testDirPath, pluginPrefix);
    expect(plugin.verifyPluginPrefixAdded(pluginPrefix)).toBeTruthy();
    await plugin.removePlugPrefix(testDirPath, pluginPrefix);
    expect(plugin.verifyPluginPrefixAdded(pluginPrefix)).toBeFalsy();
  });
});
