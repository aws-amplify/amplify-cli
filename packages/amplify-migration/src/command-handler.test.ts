import fs from 'node:fs/promises';
import path from 'node:path';

import { AmplifyClient, GetAppCommand } from '@aws-sdk/client-amplify';
import { updateAmplifyYmlFile, updateCustomResources, updateCdkStackFile, getProjectInfo } from './command-handlers';
import { pathManager, stateManager } from '@aws-amplify/amplify-cli-core';

jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  cp: jest.fn(),
}));

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    findProjectRoot: jest.fn(),
  },
  stateManager: {
    getMeta: jest.fn(),
  },
}));

const actualUpdateCdkStackFile = jest.requireActual('./command-handlers').updateCdkStackFile;
const actualGetProjectInfoFile = jest.requireActual('./command-handlers').getProjectInfo;

// Mock the internal methods
jest.mock('./command-handlers', () => ({
  ...jest.requireActual('./command-handlers'),
  updateCdkStackFile: jest.fn(),
  getProjectInfo: jest.fn(),
}));

jest.mock('@aws-sdk/client-amplify');

const GEN1_COMMAND = 'amplifyPush --simple';
const GEN2_COMMAND = 'npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID';

describe('updateAmplifyYmlFile', () => {
  const amplifyClient = new AmplifyClient();
  const mockAppId = 'testAppId';
  const amplifyYmlPath = '/mockRootDir/amplify.yml';
  const mockBuildSpec = `version: 1
backend:
  phases:
    build:
      commands:
        - '# Execute Amplify CLI with the helper script'
        - amplifyPush --simple
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: build
    files:
      - '**/*'
  cache:
    paths:
      - .npm/**/*`;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(pathManager.findProjectRoot).mockReturnValue('/mockRootDir');
  });

  it('should update amplify.yml file if it exists', async () => {
    jest.mocked(fs.readFile).mockResolvedValue(mockBuildSpec);

    await updateAmplifyYmlFile(amplifyClient, mockAppId);

    expect(fs.readFile).toHaveBeenCalledWith(amplifyYmlPath, 'utf-8');
    expect(fs.writeFile).toHaveBeenCalledWith(amplifyYmlPath, mockBuildSpec.replace(new RegExp(GEN1_COMMAND, 'g'), GEN2_COMMAND), {
      encoding: 'utf-8',
    });
  });

  it('should create amplify.yml file with updated buildSpec if it does not exist', async () => {
    jest.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
    (AmplifyClient.prototype.send as jest.Mock).mockResolvedValue({
      app: { buildSpec: mockBuildSpec },
    });

    await updateAmplifyYmlFile(amplifyClient, mockAppId);

    expect(AmplifyClient.prototype.send).toHaveBeenCalledWith(expect.any(GetAppCommand));
    expect(fs.writeFile).toHaveBeenCalledWith(amplifyYmlPath, mockBuildSpec.replace(new RegExp(GEN1_COMMAND, 'g'), GEN2_COMMAND), {
      encoding: 'utf-8',
    });
  });

  it('should not throw an error if buildSpec is not found in the app', async () => {
    jest.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
    (AmplifyClient.prototype.send as jest.Mock).mockResolvedValue({
      app: {},
    });

    await expect(updateAmplifyYmlFile(amplifyClient, mockAppId)).resolves.not.toThrow();
  });

  it('should throw an error if app is not found', async () => {
    jest.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
    (AmplifyClient.prototype.send as jest.Mock).mockResolvedValue({});

    await expect(updateAmplifyYmlFile(amplifyClient, mockAppId)).rejects.toThrow('App not found');
  });

  it('should throw the original error if it is not related to file not found', async () => {
    const error = new Error('Some other error');
    jest.mocked(fs.readFile).mockRejectedValue(error);

    await expect(updateAmplifyYmlFile(amplifyClient, mockAppId)).rejects.toThrow(error);
  });
});

describe('updateCustomResources', () => {
  const mockRootDir = '/mock/root/dir';

  const mockProjectConfig = JSON.stringify({
    projectName: 'testProject',
    version: '3.1',
    frontend: 'javascript',
    javascript: {
      framework: 'react',
      config: {
        SourceDir: 'src',
        DistributionDir: 'build',
        BuildCommand: 'npm run-script build',
        StartCommand: 'npm run-script start',
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(pathManager.findProjectRoot).mockReturnValue(mockRootDir);
    jest.mocked(stateManager.getMeta).mockReturnValue({
      custom: {
        resource1: {},
        resource2: {},
      },
    });

    jest.mocked(fs.mkdir).mockResolvedValue(undefined);
    jest.mocked(fs.cp).mockResolvedValue(undefined);
    jest.mocked(fs.readFile).mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.includes('project-config.json')) {
        return Promise.resolve(mockProjectConfig);
      }
      return Promise.resolve('{}');
    });

    jest.mocked(getProjectInfo).mockResolvedValue("{envName: `${AMPLIFY_GEN_1_ENV_NAME}`, projectName: 'testProject'}");

    jest.mocked(updateCdkStackFile).mockResolvedValue(undefined);
  });

  it('should copy custom resources and types folder and call updateCdkStackFile', async () => {
    await updateCustomResources();

    expect(fs.mkdir).toHaveBeenCalledWith('amplify-gen2/amplify/custom', { recursive: true });
    expect(fs.mkdir).toHaveBeenCalledWith('amplify-gen2/amplify/types', { recursive: true });

    expect(fs.cp).toHaveBeenCalledWith(path.join(mockRootDir, 'amplify', 'backend', 'custom'), 'amplify-gen2/amplify/custom', {
      recursive: true,
      filter: expect.any(Function),
    });

    expect(fs.cp).toHaveBeenCalledWith(path.join(mockRootDir, 'amplify', 'backend', 'types'), 'amplify-gen2/amplify/types', {
      recursive: true,
    });
  });

  it('should filter out package.json and yarn.lock files', async () => {
    await updateCustomResources();

    const cpCalls = (fs.cp as jest.Mock).mock.calls;
    const filterFn = cpCalls.find((call) => call[2]?.filter)?.[2]?.filter;

    expect(filterFn).toBeDefined();
    expect(filterFn('some/path/package.json')).toBe(false);
    expect(filterFn('some/path/yarn.lock')).toBe(false);
    expect(filterFn('some/path/other-file.js')).toBe(true);
  });

  it('should handle file system errors gracefully', async () => {
    const fsError = new Error('File system error');
    jest.mocked(fs.mkdir).mockRejectedValue(fsError);

    await expect(updateCustomResources()).rejects.toThrow('File system error');
  });

  it('should handle empty custom resources object', async () => {
    jest.mocked(stateManager.getMeta).mockReturnValue({ custom: {} });

    await updateCustomResources();

    expect(fs.cp).not.toHaveBeenCalled();
    expect(updateCdkStackFile).not.toHaveBeenCalled();
  });
});

describe('updateCdkStackFile', () => {
  const mockCustomResources = ['resource1'];
  const mockCustomResourcesPath = 'amplify-gen2/amplify/custom';
  const mockProjectRoot = '/mockRootDir';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(updateCdkStackFile).mockImplementation(actualUpdateCdkStackFile);
    jest.mocked(getProjectInfo).mockImplementation(actualGetProjectInfoFile);
    jest.mocked(pathManager.findProjectRoot).mockReturnValue('/mockRootDir');
  });

  afterEach(() => {
    // Reset to the mock after each test if needed
    jest.mocked(updateCdkStackFile).mockReset();
    jest.mocked(getProjectInfo).mockReset();
  });

  it('should correctly transform CDK stack file content', async () => {
    const originalCdkContent = `
      import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
      import * as cdk from 'aws-cdk-lib';
      
      export class cdkStack extends cdk.Stack {
        constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
          super(scope, id, props);
          
          const projectInfo = AmplifyHelpers.getProjectInfo();
          AmplifyHelpers.addResourceDependency(this, 
            {
              category: "custom",
              resourceName: "customResource1",
            },
            {
              category: "auth",
              resourceName: "authResource1",
            }
          );
        }
      }
    `;

    const mockProjectConfig = JSON.stringify({
      projectName: 'testProject',
      version: '3.1',
      frontend: 'javascript',
      javascript: {
        framework: 'react',
        config: {
          SourceDir: 'src',
          DistributionDir: 'build',
          BuildCommand: 'npm run-script build',
          StartCommand: 'npm run-script start',
        },
      },
    });

    // Mock readFile to return content for the correct stack file path
    jest.mocked(fs.readFile).mockImplementation((filePath) => {
      if (typeof filePath === 'string' && filePath.includes('project-config.json')) {
        return Promise.resolve(mockProjectConfig);
      }
      if (filePath === path.join(mockCustomResourcesPath, 'resource1', 'cdk-stack.ts')) {
        return Promise.resolve(originalCdkContent);
      }
      return Promise.resolve('{}');
    });

    jest.mocked(getProjectInfo).mockResolvedValue("{envName: `${AMPLIFY_GEN_1_ENV_NAME}`, projectName: 'testProject'}");

    await updateCdkStackFile(mockCustomResources, mockCustomResourcesPath, mockProjectRoot);

    // Verify writeFile was called with the correct path and transformed content
    expect(fs.writeFile).toHaveBeenCalled();
    const writeFileCall = (fs.writeFile as jest.Mock).mock.calls[0];
    const transformedContent = writeFileCall[1];

    // Verify specific transformations
    expect(transformedContent).not.toContain('import { AmplifyHelpers }'); // Import removed
    expect(transformedContent).toContain(
      "throw new Error('Follow https://docs.amplify.aws/react/start/migrate-to-gen2/ to update the resource dependency')",
    ); // Error added
    expect(transformedContent).toContain("const projectInfo = {envName: `${AMPLIFY_GEN_1_ENV_NAME}`, projectName: 'testProject'}"); // Project info replaced
  });
});
