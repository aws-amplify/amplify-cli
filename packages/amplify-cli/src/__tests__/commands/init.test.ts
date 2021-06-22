import { $TSContext, getPackageManager, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { execSync } from 'child_process';
import { ensureDir, existsSync, readFileSync, readJSON, readdirSync } from 'fs-extra';
import { sync } from 'which';
import { preInitSetup } from '../../init-steps/preInitSetup';
import { analyzeProject } from '../../init-steps/s0-analyzeProject';
import { initFrontend } from '../../init-steps/s1-initFrontend';
import { scaffoldProjectHeadless } from '../../init-steps/s8-scaffoldHeadless';

jest.mock('amplify-cli-core');
jest.mock('child_process');
jest.mock('fs-extra');
jest.mock('which');

(readJSON as jest.Mock).mockReturnValue({});
(ensureDir as jest.Mock).mockReturnValue(Promise.resolve());
(readFileSync as jest.Mock).mockReturnValue('{}');
(existsSync as jest.Mock).mockReturnValue(true);
(readdirSync as jest.Mock).mockReturnValue([]);
(sync as jest.MockedFunction<typeof sync>).mockReturnValue('mock/path');
(getPackageManager as jest.MockedFunction<typeof getPackageManager>).mockReturnValue({
  executable: 'yarn',
  lockFile: 'mock.lock',
  packageManager: 'yarn',
});

describe('amplify init: ', () => {
  const mockGetProjectConfigFilePath = jest.spyOn(pathManager, 'getProjectConfigFilePath');
  const mockGetAmplifyDirPath = jest.spyOn(pathManager, 'getAmplifyDirPath');
  const mockGetDotConfigDirPath = jest.spyOn(pathManager, 'getDotConfigDirPath');
  const mockGetBackendDirPath = jest.spyOn(pathManager, 'getBackendDirPath');
  const mockGetGitIgnoreFilePath = jest.spyOn(pathManager, 'getGitIgnoreFilePath');

  const mockGetProjectConfig = jest.spyOn(stateManager, 'getProjectConfig').mockReturnValue({ projectName: 'mockProject' });
  const mockGetLocalEnvInfo = jest.spyOn(stateManager, 'getLocalEnvInfo').mockReturnValue({ defaultEditor: 'gedit' });
  const mockGetTeamProviderInfo = jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({});

  const mockReadJson = jest.spyOn(JSONUtilities, 'readJson').mockReturnValue({});

  const mockPathManager = {
    getProjectConfigFilePath: mockGetProjectConfigFilePath,
    getAmplifyDirPath: mockGetAmplifyDirPath,
    getDotConfigDirPath: mockGetDotConfigDirPath,
    getBackendDirPath: mockGetBackendDirPath,
    getGitIgnoreFilePath: mockGetGitIgnoreFilePath,
  };

  const mockStateManager = {
    getProjectConfig: mockGetProjectConfig,
    getLocalEnvInfo: mockGetLocalEnvInfo,
    getTeamProviderInfo: mockGetTeamProviderInfo,
  };

  const mockContext = ({
    amplify: {
      AmplifyToolkit: jest.fn(),
      pathManager: mockPathManager,
      getProjectConfig: mockGetProjectConfig,
      getAllEnvs: jest.fn().mockReturnValue([]),
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
    JSONUtilities: {
      readJSON: mockReadJson,
    },
    stateManager: mockStateManager,
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
