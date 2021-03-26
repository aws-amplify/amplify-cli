import { execSync } from 'child_process';
import { ensureDir, existsSync, readFileSync, readJSON, readdirSync } from 'fs-extra';

import { $TSContext, pathManager } from 'amplify-cli-core';

import { preInitSetup } from '../../init-steps/preInitSetup';
import { analyzeProject } from '../../init-steps/s0-analyzeProject';
import { initFrontend } from '../../init-steps/s1-initFrontend';
import { scaffoldProjectHeadless } from '../../init-steps/s8-scaffoldHeadless';
import { getPackageManager, normalizePackageManagerForOS } from '../../packageManagerHelpers';
jest.mock('child_process');
jest.mock('fs-extra');

(readJSON as jest.Mock).mockReturnValue({});
(ensureDir as jest.Mock).mockReturnValue(Promise.resolve());
(readFileSync as jest.Mock).mockReturnValue('{}');
(existsSync as jest.Mock).mockReturnValue(true);
(readdirSync as jest.Mock).mockReturnValue([]);

jest.mock('../../packageManagerHelpers');

describe('amplify init: ', () => {
  const mockGetProjectConfigFilePath = jest.spyOn(pathManager, 'getProjectConfigFilePath');
  const mockGetAmplifyDirPath = jest.spyOn(pathManager, 'getAmplifyDirPath');
  const mockGetDotConfigDirPath = jest.spyOn(pathManager, 'getDotConfigDirPath');
  const mockGetBackendDirPath = jest.spyOn(pathManager, 'getBackendDirPath');
  const mockGetGitIgnoreFilePath = jest.spyOn(pathManager, 'getGitIgnoreFilePath');

  (getPackageManager as jest.Mock).mockReturnValue('yarn');
  (normalizePackageManagerForOS as jest.Mock).mockReturnValue('yarn');

  const mockGetProjectConfig = jest.fn(() => ({}));

  const mockPathManager = {
    getProjectConfigFilePath: mockGetProjectConfigFilePath,
    getAmplifyDirPath: mockGetAmplifyDirPath,
    getDotConfigDirPath: mockGetDotConfigDirPath,
    getBackendDirPath: mockGetBackendDirPath,
    getGitIgnoreFilePath: mockGetGitIgnoreFilePath,
  };

  const mockContext = ({
    amplify: {
      AmplifyToolkit: jest.fn(),
      pathManager: mockPathManager,
      getProjectConfig: mockGetProjectConfig,
    },
    parameters: {
      options: {},
      command: 'env', // to avoid default dx flow
    },
    usageData: {
      emitError: jest.fn(),
      emitSuccess: jest.fn(),
    },
    print: {
      warning: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      success: jest.fn(),
    },
    migrationInfo: jest.fn(),
    projectHasMobileHubResources: jest.fn(),
    prompt: jest.fn(),
    exeInfo: {
      inputParams: {
        amplify: {},
      },
    },
    input: {},
    runtime: {},
    pluginPlatform: {},
  } as unknown) as $TSContext;
  jest.mock('amplify-cli-core', () => ({
    exitOnNextTick: jest.fn(),
  }));

  const { run } = require('../../commands/init');
  const initCommand = run;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('init run method should exist', () => {
    expect(initCommand).toBeDefined();
  });

  describe('init:preInit', () => {
    it('should set up a sample app in an empty directory', async () => {
      const appUrl = 'https://github.com/aws-samples/aws-amplify-graphql';
      const context = {
        ...mockContext,
        parameters: {
          options: {
            app: appUrl,
          },
        },
      };
      await preInitSetup(context);
      expect(execSync).toBeCalledWith(`git ls-remote ${appUrl}`, { stdio: 'ignore' });
      expect(execSync).toBeCalledWith(`git clone ${appUrl} .`, { stdio: 'inherit' });
      expect(execSync).toBeCalledWith('yarn install', { stdio: 'inherit' });
    });
  });

  describe('init:analyzeProject', () => {
    it('should initialize exeInfo', async () => {
      const newContext = await analyzeProject(mockContext);
      expect(newContext.exeInfo.projectConfig).not.toBeUndefined();
      expect(newContext.exeInfo.localEnvInfo).not.toBeUndefined();
      expect(newContext.exeInfo.teamProviderInfo).not.toBeUndefined();
      expect(newContext.exeInfo.metaData).not.toBeUndefined();
    });
  });

  describe('init:initFrontend', () => {
    it('should use current project config if it is not a new project', async () => {
      await initFrontend({ ...mockContext, exeInfo: { isNewProject: false } });
      expect(mockGetProjectConfig).toBeCalled();
    });
  });

  describe('init:scaffoldHeadless', () => {
    it('should scaffold a new project', async () => {
      const projectName = 'projectName';
      const frontend = 'ios';
      const context = {
        ...mockContext,
        exeInfo: {
          projectConfig: {
            projectName,
            frontend,
          },
        },
      };
      const cwd = 'currentdir';
      const spy = jest.spyOn(process, 'cwd');
      spy.mockReturnValue(cwd);

      await scaffoldProjectHeadless(context);
      expect(mockGetAmplifyDirPath).toBeCalledWith(cwd);
      expect(mockGetDotConfigDirPath).toBeCalledWith(cwd);
      expect(mockGetProjectConfigFilePath).toBeCalledWith(cwd);
      expect(mockGetBackendDirPath).toBeCalledWith(cwd);
      expect(mockGetGitIgnoreFilePath).toBeCalledWith(cwd);
    });
  });
});
