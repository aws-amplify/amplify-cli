import { JSONUtilities } from '../../../../amplify-cli-core/lib';
import { PluginInfo, PluginManifest, PluginPlatform } from 'amplify-cli-core';
import { checkPlatformHealth, getOfficialPlugins } from '../../plugin-helpers/platform-health-check';

jest.mock('chalk', () => ({
  yellow: jest.fn().mockImplementation(input => input),
}));

const corePackageJson = {
  name: '@aws-amplify/cli',
  version: '5.4.0',
  amplify: {
    officialPlugins: {
      core: {
        name: 'core',
        type: 'core',
        packageName: '@aws-amplify/cli',
      },
      api: {
        name: 'api',
        type: 'category',
        packageName: 'amplify-category-api',
      },
      hosting: [
        {
          name: 'hosting',
          type: 'category',
          packageName: '@aws-amplify/amplify-category-hosting',
        },
        {
          name: 'hosting',
          type: 'category',
          packageName: 'amplify-console-hosting',
        },
      ],
      codegen: {
        name: 'codegen',
        type: 'util',
        packageName: 'amplify-codegen',
      },
    },
  },
  dependencies: {
    'amplify-category-api': '2.31.20',
    '@aws-amplify/amplify-category-hosting': '2.7.18',
    'amplify-codegen': '^2.23.1',
    'amplify-console-hosting': '1.9.9',
    'amplify-container-hosting': '1.3.20',
  },
};

jest.spyOn(JSONUtilities, 'readJson');

describe('platform-health-check', () => {
  beforeAll(() => {
    const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
    JSONUtilitiesMock.readJson.mockReturnValue(corePackageJson);
  });

  describe('getOfficialPlugins', () => {
    it('returns official plugin descriptions', () => {
      expect(getOfficialPlugins()).toEqual({
        core: {
          name: 'core',
          packageName: '@aws-amplify/cli',
          packageVersion: '5.4.0',
          type: 'core',
        },
        api: {
          name: 'api',
          packageName: 'amplify-category-api',
          packageVersion: '2.31.20',
          type: 'category',
        },
        codegen: {
          name: 'codegen',
          packageName: 'amplify-codegen',
          packageVersion: '^2.23.1',
          type: 'util',
        },
        hosting: [
          {
            name: 'hosting',
            packageName: '@aws-amplify/amplify-category-hosting',
            packageVersion: '2.7.18',
            type: 'category',
          },
          {
            name: 'hosting',
            packageName: 'amplify-console-hosting',
            packageVersion: '1.9.9',
            type: 'category',
          },
        ],
      });
    });
  });

  describe('checkPlatformHealth', () => {
    beforeEach(() => {
      console.log = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('returns true when every official plugins is active and match plugin description', async () => {
      const pluginPlatform: PluginPlatform = new PluginPlatform();
      pluginPlatform.plugins = {
        core: [new PluginInfo('@aws-amplify/cli', '5.4.0', '', new PluginManifest('core', 'core'))],
        hosting: [
          new PluginInfo('@aws-amplify/amplify-category-hosting', '2.7.18', '', new PluginManifest('hosting', 'category')),
          new PluginInfo('amplify-console-hosting', '1.9.9', '', new PluginManifest('hosting', 'category')),
        ],
        codegen: [new PluginInfo('amplify-codegen', '2.27.0', '', new PluginManifest('codegen', 'util'))],
        api: [new PluginInfo('amplify-category-api', '2.31.20', '', new PluginManifest('api', 'category'))],
      };
      expect(await checkPlatformHealth(pluginPlatform)).toBe(true);
    });

    it('returns false when mismatch plugins exists', async () => {
      const pluginPlatform: PluginPlatform = new PluginPlatform();
      pluginPlatform.plugins = {
        core: [new PluginInfo('@aws-amplify/cli', '5.4.0', '', new PluginManifest('core', 'core'))],
        hosting: [
          new PluginInfo('@aws-amplify/amplify-category-hosting', '2.7.18', '', new PluginManifest('hosting', 'category')),
          new PluginInfo('amplify-console-hosting', '1.9.9', '', new PluginManifest('hosting', 'category')),
        ],
        codegen: [
          // version mismatch
          new PluginInfo('amplify-codegen', '1.30.0', '', new PluginManifest('codegen', 'util')),
        ],
        api: [new PluginInfo('amplify-category-api', '2.31.20', '', new PluginManifest('api', 'category'))],
      };

      expect(await checkPlatformHealth(pluginPlatform)).toBe(false);
      expect(console.log).toBeCalledWith('The following official plugins have mismatched packages:');
      expect(console.log).toBeCalledWith('Expected:');
      expect(console.log).toBeCalledWith('    codegen: util | amplify-codegen@^2.23.1');
    });

    it('returns false when missing or inactive plugins exists', async () => {
      const pluginPlatform: PluginPlatform = new PluginPlatform();
      pluginPlatform.plugins = {
        core: [new PluginInfo('@aws-amplify/cli', '5.4.0', '', new PluginManifest('core', 'core'))],
        hosting: [
          new PluginInfo('@aws-amplify/amplify-category-hosting', '2.7.18', '', new PluginManifest('hosting', 'category')),
          // missing 'amplify-console-hosting'
        ],
        codegen: [new PluginInfo('amplify-codegen', '2.27.0', '', new PluginManifest('codegen', 'util'))],
        // missing 'api'
      };

      expect(await checkPlatformHealth(pluginPlatform)).toBe(false);
      expect(console.log).toBeCalledWith('The following official plugins are missing or inactive:');
      expect(console.log).toBeCalledWith('    hosting: category | amplify-console-hosting@1.9.9');
      expect(console.log).toBeCalledWith('    api: category | amplify-category-api@2.31.20');
    });
  });
});
