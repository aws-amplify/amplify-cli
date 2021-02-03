import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { v4 as uuid } from 'uuid';
import {
  EnvVarFormatError,
  FeatureFlags,
  CLIEnvironmentProvider,
  CLIContextEnvironmentProvider,
  JSONUtilities,
  pathManager,
  FeatureFlagRegistration,
} from '..';
import { FeatureFlagEnvironmentProvider } from '../feature-flags/featureFlagEnvironmentProvider';
import { FeatureFlagFileProvider } from '../feature-flags/featureFlagFileProvider';

// These constants are not exported, hence the redefinition for tests
const amplifyDirName = 'amplify';
const amplifyConfigFileName = 'cli.json';

describe('feature flags', () => {
  describe('featureflag provider tests', () => {
    const realProcessEnv: NodeJS.ProcessEnv = { ...process.env };

    beforeEach(() => {
      jest.resetModules();
    });

    afterEach(() => {
      process.env = { ...realProcessEnv };
    });

    test('creates default features section in existing config file if features does not exist', async () => {
      const templateConfigFileName = path.join(__dirname, 'testFiles', 'project-with-no-features', amplifyConfigFileName);

      const osTempDir = await fs.realpath(os.tmpdir());
      const tempProjectDir = path.join(osTempDir, `amp-${uuid()}`);

      try {
        await fs.mkdirs(tempProjectDir);

        process.chdir(tempProjectDir);

        const projectConfigFileName = pathManager.getCLIJSONFilePath(tempProjectDir);

        await fs.mkdirs(path.dirname(projectConfigFileName));

        await fs.copyFile(templateConfigFileName, projectConfigFileName);

        await FeatureFlags.initialize(({ getCurrentEnvName: () => 'dev' } as unknown) as CLIEnvironmentProvider, undefined, getTestFlags());

        await FeatureFlags.ensureDefaultFeatureFlags(true);

        const updatedConfig = JSONUtilities.readJson<any>(projectConfigFileName);

        expect(updatedConfig.usageTracking).toBeDefined();
        expect(updatedConfig.features).toMatchObject(FeatureFlags.getNewProjectDefaults());
      } finally {
        rimraf.sync(tempProjectDir);
      }
    });

    test('does not overwrite features section in existing config file if it exists', async () => {
      const templateConfigFileName = path.join(__dirname, 'testFiles', 'project-with-features', amplifyConfigFileName);

      const osTempDir = await fs.realpath(os.tmpdir());
      const tempProjectDir = path.join(osTempDir, `amp-${uuid()}`);

      try {
        await fs.mkdirs(tempProjectDir);

        process.chdir(tempProjectDir);

        const projectConfigFileName = path.join(tempProjectDir, amplifyConfigFileName);

        await fs.mkdirs(path.dirname(projectConfigFileName));

        await fs.copyFile(templateConfigFileName, projectConfigFileName);

        await FeatureFlags.initialize(({ getCurrentEnvName: () => 'dev' } as unknown) as CLIEnvironmentProvider, undefined, getTestFlags());
        await FeatureFlags.ensureDefaultFeatureFlags(true);

        const originalConfig = (await fs.readFile(templateConfigFileName)).toString();
        const updatedConfig = (await fs.readFile(projectConfigFileName)).toString();

        expect(updatedConfig).toEqual(originalConfig);
      } finally {
        rimraf.sync(tempProjectDir);
      }
    });

    test('creates config file from default features file if file does not exist', async () => {
      const osTempDir = await fs.realpath(os.tmpdir());
      const tempProjectDir = path.join(osTempDir, `amp-${uuid()}`);

      try {
        await fs.mkdirs(tempProjectDir);

        process.chdir(tempProjectDir);

        const projectConfigFileName = path.join(tempProjectDir, amplifyDirName, amplifyConfigFileName);

        await fs.mkdirs(path.dirname(projectConfigFileName));

        await FeatureFlags.initialize(({ getCurrentEnvName: () => 'dev' } as unknown) as CLIEnvironmentProvider, undefined, getTestFlags());
        await FeatureFlags.ensureDefaultFeatureFlags(true);

        const createdConfig = (await fs.readFile(projectConfigFileName)).toString();

        expect(createdConfig).not.toBe('');
      } finally {
        rimraf.sync(tempProjectDir);
      }
    });

    test('initializes falsy feature flag with truthy default', async () => {
      const templateConfigFileName = path.join(__dirname, 'testFiles', 'project-with-feature-off', amplifyConfigFileName);

      const osTempDir = await fs.realpath(os.tmpdir());
      const tempProjectDir = path.join(osTempDir, `amp-${uuid()}`);

      try {
        await fs.mkdirs(tempProjectDir);

        process.chdir(tempProjectDir);

        const projectConfigFileName = pathManager.getCLIJSONFilePath(tempProjectDir);

        await fs.mkdirs(path.dirname(projectConfigFileName));

        await fs.copyFile(templateConfigFileName, projectConfigFileName);

        await FeatureFlags.initialize(({ getCurrentEnvName: () => 'dev' } as unknown) as CLIEnvironmentProvider);

        expect(FeatureFlags.getBoolean('graphQLTransformer.validateTypeNameReservedWords')).toBe(false);
      } finally {
        rimraf.sync(tempProjectDir);
      }
    });

    test('missing environmentProvider argument', async () => {
      await expect(async () => {
        await FeatureFlags.initialize((undefined as unknown) as CLIContextEnvironmentProvider, undefined, getTestFlags());
      }).rejects.toThrowError(`'environmentProvider' argument is required`);
    });

    test('initialize feature flag provider successfully', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await FeatureFlags.initialize(envProvider, undefined, getTestFlags());

      const transformerVersion = FeatureFlags.getNumber('graphQLTransformer.transformerVersion');
      const isDefaultQueryEnabled = FeatureFlags.getBoolean('keyTransformer.defaultQuery');

      expect(transformerVersion).toBe(4);
      expect(isDefaultQueryEnabled).toBe(true);
    });

    test('initialize feature flag provider successfully with no files and return new project defaults', async () => {
      const osTempDir = await fs.realpath(os.tmpdir());
      const tempProjectDir = path.join(osTempDir, `amp-${uuid()}`);

      try {
        await fs.mkdirs(tempProjectDir);

        process.chdir(tempProjectDir);

        await FeatureFlags.initialize(({ getCurrentEnvName: () => 'dev' } as unknown) as CLIEnvironmentProvider, true, getTestFlags());

        const transformerVersion = FeatureFlags.getNumber('graphQLTransformer.transformerVersion');
        const isDefaultQueryEnabled = FeatureFlags.getBoolean('keyTransformer.defaultQuery');

        expect(transformerVersion).toBe(5);
        expect(isDefaultQueryEnabled).toBe(true);
      } finally {
        rimraf.sync(tempProjectDir);
      }
    });

    test('initialize feature flag provider fail with json error', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-json-error');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await expect(async () => {
        await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      }).rejects.toThrowError(
        `Found '}' where a key name was expected (check your syntax or use quotes if the key name includes {}[],: or whitespace) at line 1,0 >>> Not a json {\n ...`,
      );
    });

    test('initialize feature flag provider successfully - overrides 1', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-1');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      const effectiveFlags = FeatureFlags.getEffectiveFlags();

      expect(effectiveFlags).toMatchObject({
        graphqltransformer: {
          transformerversion: 3,
        },
        keytransformer: {
          defaultquery: false,
        },
      });
    });

    test('initialize feature flag provider successfully - overrides 2', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-2');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      const effectiveFlags = FeatureFlags.getEffectiveFlags();

      expect(effectiveFlags).toMatchObject({
        graphqltransformer: {
          transformerversion: 4,
        },
        keytransformer: {
          defaultquery: true,
        },
      });
    });

    test('initialize feature flag provider successfully - overrides 3', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-3');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      const effectiveFlags = FeatureFlags.getEffectiveFlags();

      expect(effectiveFlags).toMatchObject({
        graphqltransformer: {
          transformerversion: 5,
        },
        keytransformer: {
          defaultquery: false,
        },
      });
    });

    test('initialize feature flag provider successfully - overrides 4', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-4');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      const effectiveFlags = FeatureFlags.getEffectiveFlags();

      expect(effectiveFlags).toMatchObject({
        graphqltransformer: {
          transformerversion: 6,
        },
        keytransformer: {
          defaultquery: true,
        },
      });
    });

    test('initialize feature flag provider fail with env error - section', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-env-section');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await expect(async () => {
        await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      }).rejects.toThrowError(`Section 'foo' is not registered in feature provider`);
    });

    test('initialize feature flag provider fail with env error - value', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-env-value');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await expect(async () => {
        await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      }).rejects.toThrowError(`Flag 'bar' within 'graphqltransformer' is not registered in feature provider`);
    });

    test('initialize feature flag provider fail with env error - bool', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-env-bool');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await expect(async () => {
        await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      }).rejects.toThrowError(`Invalid boolean value: 'invalid' for 'defaultquery' in section 'keytransformer'`);
    });

    test('initialize feature flag provider fail with env error - number', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-env-number');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await expect(async () => {
        await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      }).rejects.toThrowError(`Invalid number value: 'invalid' for 'transformerversion' in section 'graphqltransformer'`);
    });

    test('initialize feature flag provider fail unknown flags', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const projectPath = path.join(__dirname, 'testFiles', 'testProject-initialize-unknown-flag');

      // Set current cwd to projectPath for .env to work correctly
      process.chdir(projectPath);

      await expect(async () => {
        await FeatureFlags.initialize(envProvider, undefined, getTestFlags());
      }).rejects.toMatchObject({
        message: 'Invalid feature flag configuration',
        name: 'JSONValidationError',
        unknownFlags: ['graphqltransformer.foo', 'graphqltransformer.bar'],
        otherErrors: ['graphqltransformer.transformerversion: should be number'],
      });
    });

    const getTestFlags = (): Record<string, FeatureFlagRegistration[]> => {
      return {
        graphQLTransformer: [
          {
            name: 'transformerVersion',
            type: 'number',
            defaultValueForExistingProjects: 4,
            defaultValueForNewProjects: 5,
          },
        ],
        keyTransformer: [
          {
            name: 'defaultQuery',
            type: 'boolean',
            defaultValueForExistingProjects: false,
            defaultValueForNewProjects: true,
          },
        ],
      };
    };
  });

  describe('environment provider tests', () => {
    const realProcessEnv: NodeJS.ProcessEnv = { ...process.env };

    let provider: FeatureFlagEnvironmentProvider;

    beforeEach(() => {
      jest.resetModules();

      provider = new FeatureFlagEnvironmentProvider();
    });

    afterEach(() => {
      process.env = { ...realProcessEnv };
    });

    test('initialization does not fail when process.env is not available', () => {
      process.env = {};

      expect(process.env).toEqual({});

      provider.load();
    });

    test('successfully parse every form of variables', async () => {
      setVariables({
        AMPLIFYCLI_SECTION__PROPERTY: '1',
        'AMPLIFYCLI-ENV_SECTION__PROPERTY': '1',
        AMPLIFYCLI_EMPTY__FORCOVERAGE: '',
      });

      const values = await provider.load();

      expect(values).toMatchObject({
        project: {
          section: {
            property: '1',
          },
        },
        environments: {
          env: {
            section: {
              property: '1',
            },
          },
        },
      });
    });

    test('validation fails on incomplete variable', async () => {
      await expectFailure('AMPLIFYCLI');
    });

    test('validation fails on incomplete variable with no section', async () => {
      await expectFailure('AMPLIFYCLI_');
    });

    test('validation fails on incomplete variable with no property', async () => {
      await expectFailure('AMPLIFYCLI_SECTION');
    });

    test('validation fails on incomplete variable with separator, no property', async () => {
      await expectFailure('AMPLIFYCLI_SECTION__');
    });

    test('validation fails on incomplete variable - with env', async () => {
      await expectFailure('AMPLIFYCLI-ENV');
    });

    test('validation fails on incomplete variable with no section - with env', async () => {
      await expectFailure('AMPLIFYCLI-ENV_');
    });

    test('validation fails on incomplete variable with no property - with env', async () => {
      await expectFailure('AMPLIFYCLI-ENV_SECTION');
    });

    test('validation fails on incomplete variable with separator, no property - with env', async () => {
      await expectFailure('AMPLIFYCLI-ENV_SECTION__');
    });

    test('error with empty field returns unknown', () => {
      expect(() => {
        throw new EnvVarFormatError((undefined as unknown) as string);
      }).toThrowError(`Invalid variable name format: '<unknown>'`);
    });

    const setVariables = (values: { [key: string]: any }) => {
      for (let key of Object.keys(values)) {
        process.env[key] = values[key];
      }
    };

    const expectFailure = async (variableName: string): Promise<void> => {
      setVariables({
        [variableName]: '1',
      });

      await expect(async () => {
        const _ = await provider.load();
      }).rejects.toThrowError(`Invalid variable name format: '${variableName}'`);
    };
  });

  describe('file provider tests', () => {
    test('missing projectPath argument', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);

      await expect(async () => {
        const provider = new FeatureFlagFileProvider(envProvider, {
          projectPath: undefined,
        });

        await provider.load();
      }).rejects.toThrowError(`'projectPath' option is missing`);
    });

    test('reads features when both files exists', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const provider = new FeatureFlagFileProvider(envProvider, {
        projectPath: path.join(__dirname, 'testFiles', 'testProject-both-files'),
      });

      const features = await provider.load();

      expect(features).toMatchObject({
        project: {
          graphqltransformer: {
            transformerversion: 5,
          },
        },
        environments: {
          dev: {
            graphqltransformer: {
              transformerversion: 6,
            },
          },
        },
      });
    });

    test('reads features when no environment file exist', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const provider = new FeatureFlagFileProvider(envProvider, {
        projectPath: path.join(__dirname, 'testFiles', 'testProject-no-env'),
      });

      const features = await provider.load();

      expect(features).toMatchObject({
        project: {
          graphqltransformer: {
            transformerversion: 5,
          },
        },
        environments: {},
      });
    });

    test('reads features when no files exist', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const provider = new FeatureFlagFileProvider(envProvider, {
        projectPath: path.join(__dirname, 'testFiles', 'testProject-no-files'),
      });

      const features = await provider.load();

      expect(features).toMatchObject({
        project: {},
        environments: {},
      });
    });

    test('reads features when only environment file exists', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return {
            envName: 'dev',
          };
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const provider = new FeatureFlagFileProvider(envProvider, {
        projectPath: path.join(__dirname, 'testFiles', 'testProject-no-project'),
      });

      const features = await provider.load();

      expect(features).toMatchObject({
        project: {},
        environments: {
          dev: {
            graphqltransformer: {
              transformerversion: 6,
            },
          },
        },
      });
    });

    test('reads features when no files exists and env is unavailable', async () => {
      const context: any = {
        getEnvInfo: (_: boolean): any => {
          return undefined;
        },
      };

      const envProvider: CLIEnvironmentProvider = new CLIContextEnvironmentProvider(context);
      const provider = new FeatureFlagFileProvider(envProvider, {
        projectPath: path.join(__dirname, 'testFiles', 'testProject-no-files'),
      });

      const features = await provider.load();

      expect(features).toMatchObject({
        project: {},
        environments: {},
      });
    });
  });
});
