import { execSync } from 'child_process';

import { $TSContext, UnknownArgumentError } from 'amplify-cli-core';

import { preInitSetup } from '../../init-steps/preInitSetup'
import { analyzeProject } from '../../init-steps/s0-analyzeProject'
import { initFrontend } from '../../init-steps/s1-initFrontend'
import { scaffoldProjectHeadless } from '../../init-steps/s8-scaffoldHeadless';

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('fs-extra', () => ({ 
  readdirSync: () => [],
  copy: jest.fn(),
  ensureDirSync: jest.fn(),
  ensureDir: jest.fn(() => Promise.resolve()),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  writeJSON: jest.fn(),
  readJSON: jest.fn(() => ({})),
}));
jest.mock('../../packageManagerHelpers', () => ({
  getPackageManager: () => 'yarn',
  normalizePackageManagerForOS: () => 'yarn',
}));

describe('amplify init: ', () => {
  const mockExit = jest.fn();
  const mockEmitError = jest.fn();
  const mockEmitSuccess = jest.fn();
  const mockPrint = jest.fn();
  const mockMigrationInfo = jest.fn();
  const mockprojectHasMobileHubResources = jest.fn();
  const mockPrompt = jest.fn();
  const mockGetProjectConfigFilePath = jest.fn();
  const mockGetProjectConfig = jest.fn(() => ({}));
  const mockGetAmplifyDirPath = jest.fn(() => 'amplify-dir');
  const mockGetDotConfigDirPath = jest.fn(() => 'amplify-dot-dir');
  const mockGetBackendDirPath = jest.fn(() => 'backend');
  const mockGetGitIgnoreFilePath = jest.fn(() => '.gitignore');

  const mockPathManager = {
    getProjectConfigFilePath: mockGetProjectConfigFilePath,
    getAmplifyDirPath: mockGetAmplifyDirPath,
    getDotConfigDirPath: mockGetDotConfigDirPath,
    getBackendDirPath: mockGetBackendDirPath,
    getGitIgnoreFilePath: mockGetGitIgnoreFilePath,
  };
  
  const mockContext = {
    amplify: {
      AmplifyToolkit: jest.fn(),
      pathManager: mockPathManager,
      getProjectConfig: mockGetProjectConfig,
    },
    parameters: {
      options: {},
    },
    usageData: {
      emitError: mockEmitError,
      emitSuccess: mockEmitSuccess,
    },
    print: {
      warning: mockPrint,
      error: mockPrint,
    },
    migrationInfo: mockMigrationInfo,
    projectHasMobileHubResources: mockprojectHasMobileHubResources,
    prompt: mockPrompt,
    exeInfo: {
      inputParams: {
        amplify: {
        }
      }
    },
    input: {},
    runtime: {},
    pluginPlatform: {},
  } as unknown as $TSContext;
  jest.mock('amplify-cli-core', () => ({
    exitOnNextTick: mockExit,
    UnknownArgumentError: UnknownArgumentError,
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
    it('should set up a sample app in an empty directory', async() => {
      const appUrl = 'https://github.com/aws-samples/aws-amplify-graphql';
      const context = {
        ...mockContext,
        parameters: {
          options: {
            app: appUrl,
          }
        },
      };
      await preInitSetup(context);
      expect(execSync).toBeCalledWith(`git ls-remote ${appUrl}`, {'stdio': 'ignore'});
      expect(execSync).toBeCalledWith(`git clone ${appUrl} .`, {'stdio': 'inherit'});
      expect(execSync).toBeCalledWith('yarn install', {'stdio': 'inherit'});
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
      await initFrontend({ ...mockContext, exeInfo: { isNewProject: false }});
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
          }
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
