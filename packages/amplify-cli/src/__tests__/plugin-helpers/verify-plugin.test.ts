import { verifyPlugin, validPluginName } from '../../plugin-helpers/verify-plugin';
import { JSONUtilities } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PluginVerificationError, PluginVerificationResult } from '../../domain/plugin-verification-result';
import { PluginManifest } from '../../domain/plugin-manifest';
import { AmplifyEvent } from '../../domain/amplify-event';

const corePluginJson = {
  name: 'core',
  type: 'core',
  commands: [
    'categories',
    'configure',
    'console',
    'delete',
    'env',
    'help',
    'init',
    'logout',
    'migrate',
    'plugin',
    'publish',
    'push',
    'pull',
    'run',
    'status',
    'uninstall',
    'upgrade',
    'version',
  ],
  commandAliases: {
    h: 'help',
    serve: 'run',
    ls: 'status',
  },
};

jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
}));

const fsMock = fs as jest.Mocked<typeof fs>;

describe('verify-plugin', () => {
  describe('verifyPlugin', () => {
    beforeEach(() => {
      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      readJsonMock.mockClear();
    });

    it('returns PluginDirPathNotExist error when specify not exist path', async () => {
      fsMock.pathExists.mockImplementation(() => Promise.resolve(false));
      const result = await verifyPlugin(path.join('path', 'to', 'plugin'));
      expect(result).toEqual(new PluginVerificationResult(false, PluginVerificationError.PluginDirPathNotExist));
    });

    it('returns PluginDirPathNotExist error when specify non directory path', async () => {
      fsMock.pathExists.mockImplementation(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(false),
      };
      fsMock.stat.mockResolvedValue(stat as any);
      const result = await verifyPlugin(path.join('path', 'to', 'plugin'));
      expect(result).toEqual(new PluginVerificationResult(false, PluginVerificationError.PluginDirPathNotExist));
    });

    it('returns InvalidNodePackage error when specify package.json not exists directory path', async () => {
      fsMock.pathExists.mockImplementation(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValue(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read package.json
      const error = new Error('package.json is not exists.');
      readJsonMock.mockImplementationOnce(() => {
        throw error;
      });

      const result = await verifyPlugin(path.join('path', 'to', 'plugin'));
      expect(result).toEqual(new PluginVerificationResult(false, PluginVerificationError.InvalidNodePackage, error));
    });

    it('returns MissingManifest error when amplify-plugin.json is not exists.', async () => {
      // stat package.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read package.json
      const packageJson = {};
      readJsonMock.mockReturnValueOnce(packageJson);

      // stat amplify-plugin.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(false));

      const result = await verifyPlugin(path.join('path', 'to', 'plugin'));
      const expected = new PluginVerificationResult(false, PluginVerificationError.MissingManifest, undefined, packageJson);
      expect(result).toEqual(expected);
    });

    it('returns MissingManifest error when amplify-plugin.json is not file.', async () => {
      // stat package.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read package.json
      const packageJson = {};
      readJsonMock.mockReturnValueOnce(packageJson);

      // stat amplify-plugin.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const statManifest = {
        isFile: jest.fn().mockReturnValue(false),
      };
      fsMock.stat.mockResolvedValueOnce(statManifest as any);

      const result = await verifyPlugin(path.join('path', 'to', 'plugin'));
      const expected = new PluginVerificationResult(false, PluginVerificationError.MissingManifest, undefined, packageJson);
      expect(result).toEqual(expected);
    });

    it('returns InvalidManifest error when amplify-plugin.json is not json file.', async () => {
      // stat package.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read package.json
      const packageJson = {};
      readJsonMock.mockReturnValueOnce(packageJson);

      // stat amplify-plugin.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const statManifest = {
        isFile: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(statManifest as any);

      // read amplify-plugin.json
      const error = new Error('amplify-plugin.json is not json file.');
      readJsonMock.mockImplementationOnce(() => {
        throw error;
      });

      const result = await verifyPlugin(path.join('path', 'to', 'plugin'));
      const expected = new PluginVerificationResult(false, PluginVerificationError.InvalidManifest, error, packageJson);
      expect(result).toEqual(expected);
    });

    it('returns InvalidManifest error when plugin name is invalid', async () => {
      // stat package.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read plugin package.json
      const packageJson = {};
      readJsonMock.mockReturnValueOnce(packageJson);

      // stat amplify-plugin.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const statManifest = {
        isFile: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(statManifest as any);

      // read amplify-plugin.json
      const amplifyPluginJson = {
        name: 'categories', // invalid plugin name
      };
      readJsonMock.mockReturnValueOnce(amplifyPluginJson);

      // read core package.json
      readJsonMock.mockReturnValueOnce(corePluginJson);

      const result = await verifyPlugin(path.join('path', 'to', 'plugin'));
      const expected = new PluginVerificationResult(
        false,
        PluginVerificationError.InvalidManifest,
        'Amplify CLI core command names can not be used as plugin name',
        packageJson,
      );
      expect(result).toEqual(expected);
    });

    it('returns MissingHandleAmplifyEventMethod error when plugin has invalid handle methods', async () => {
      // stat package.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read plugin package.json
      const packageJson = {};
      readJsonMock.mockReturnValueOnce(packageJson);

      // stat amplify-plugin.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const statManifest = {
        isFile: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(statManifest as any);

      // read amplify-plugin.json
      const amplifyPluginJson: PluginManifest = {
        name: 'dynamodb-export', // valid plugin name
        type: 'util',
        commands: ['version', 'help'],
        eventHandlers: [AmplifyEvent.PreInit],
      };
      readJsonMock.mockReturnValueOnce(amplifyPluginJson);

      // read core package.json
      readJsonMock.mockReturnValueOnce(corePluginJson);

      const result = await verifyPlugin(path.join(__dirname, '..', '..', '..', '__mocks__', 'invalid-plugin'));
      const expected = new PluginVerificationResult(
        false,
        PluginVerificationError.MissingHandleAmplifyEventMethod,
        undefined,
        packageJson,
        amplifyPluginJson,
      );
      expect(result).toEqual(expected);
    });

    it('returns that verified is true when plugin pass all verifications', async () => {
      // stat package.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read plugin package.json
      const packageJson = {};
      readJsonMock.mockReturnValueOnce(packageJson);

      // stat amplify-plugin.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const statManifest = {
        isFile: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(statManifest as any);

      // read amplify-plugin.json
      const amplifyPluginJson: PluginManifest = {
        name: 'dynamodb-export', // valid plugin name
        type: 'util',
        commands: ['version', 'help'],
        eventHandlers: [AmplifyEvent.PreInit],
      };
      readJsonMock.mockReturnValueOnce(amplifyPluginJson);

      // read core package.json
      readJsonMock.mockReturnValueOnce(corePluginJson);

      const result = await verifyPlugin(path.join(__dirname, '..', '..', '..', '__mocks__', 'valid-plugin'));
      const expected = new PluginVerificationResult(true, undefined, undefined, packageJson, amplifyPluginJson);
      expect(result).toEqual(expected);
    });

    it('returns that verified is true when plugin has no event handlers', async () => {
      // stat package.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const stat = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(stat as any);

      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      // read plugin package.json
      const packageJson = {};
      readJsonMock.mockReturnValueOnce(packageJson);

      // stat amplify-plugin.json
      fsMock.pathExists.mockImplementationOnce(() => Promise.resolve(true));
      const statManifest = {
        isFile: jest.fn().mockReturnValue(true),
      };
      fsMock.stat.mockResolvedValueOnce(statManifest as any);

      // read amplify-plugin.json
      const amplifyPluginJson: PluginManifest = {
        name: 'dynamodb-export', // valid plugin name
        type: 'util',
        commands: ['version', 'help'],
        eventHandlers: [],
      };
      readJsonMock.mockReturnValueOnce(amplifyPluginJson);

      // read core package.json
      readJsonMock.mockReturnValueOnce(corePluginJson);

      const result = await verifyPlugin(path.join(__dirname, '..', '..', '..', '__mocks__', 'non-event-handlers-plugin'));
      const expected = new PluginVerificationResult(true, undefined, undefined, packageJson, amplifyPluginJson);
      expect(result).toEqual(expected);
    });
  });

  describe('validPluginName', () => {
    beforeEach(() => {
      const readJsonMock = JSONUtilities.readJson as jest.MockedFunction<typeof JSONUtilities.readJson>;
      readJsonMock.mockReturnValue(corePluginJson);
    });

    it('returns result that isValid is true when specify valid plugin name', async () => {
      const result = await validPluginName('dynamo-export');
      expect(result).toEqual({ isValid: true });
    });

    it('returns result that isValid is false when specify invalid plugin name', async () => {
      const result = await validPluginName('categories');
      expect(result).toEqual({
        isValid: false,
        message: 'Amplify CLI core command names can not be used as plugin name',
      });
    });
  });
});
