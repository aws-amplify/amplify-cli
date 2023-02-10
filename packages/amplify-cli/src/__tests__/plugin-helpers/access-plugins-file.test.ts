import { readPluginsJsonFile, writePluginsJsonFile } from '../../plugin-helpers/access-plugins-file';
import { JSONUtilities, PluginPlatform } from 'amplify-cli-core';

jest.spyOn(JSONUtilities, 'readJson');
jest.spyOn(JSONUtilities, 'writeJson');

describe('access-plugins-file', () => {
  describe('readPluginsJsonFile', () => {
    it('returns plugin platform when plugins json file is exists', () => {
      const pluginPlatform = {
        excluded: {},
        lastScanTime: '2021-08-13T13:36:58.268Z',
        maxScanIntervalInSeconds: 86400,
        pluginDirectories: ['cli-local-node-modules', 'cli-parent-directory', 'global-node-modules'],
        pluginPrefixes: ['amplify-'],
        plugins: {},
        userAddedLocations: [],
      };
      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      readJsonMock.mockReturnValue(pluginPlatform);

      expect(readPluginsJsonFile()).toEqual(pluginPlatform);
      expect(readJsonMock).toBeCalledWith(expect.any(String), { throwIfNotExist: false });
    });

    it('returns undefined when plugins json file is not exists', () => {
      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      readJsonMock.mockReturnValue(undefined);

      expect(readPluginsJsonFile()).toBeUndefined();
      expect(readJsonMock).toBeCalledWith(expect.any(String), { throwIfNotExist: false });
    });
  });

  describe('writePluginsJsonFile', () => {
    it('write plugin platform as plugins json file', () => {
      const writeJsonMock = JSONUtilities.writeJson as jest.MockedFunction<typeof JSONUtilities.writeJson>;

      const pluginPlatform = new PluginPlatform();
      writePluginsJsonFile(pluginPlatform);

      expect(writeJsonMock).toBeCalledWith(expect.any(String), pluginPlatform);
    });
  });
});
