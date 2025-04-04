import fs from 'node:fs/promises';
import { AmplifyClient, GetAppCommand } from '@aws-sdk/client-amplify';
import { updateAmplifyYmlFile, removeGen1ConfigurationFiles, GEN1_CONFIGURATION_FILES } from './command-handlers';
import { pathManager } from '@aws-amplify/amplify-cli-core';

jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  rm: jest.fn(),
}));

jest.mock('@aws-amplify/amplify-cli-core');

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
    (pathManager.findProjectRoot as jest.Mock).mockReturnValue('/mockRootDir');
  });

  it('should update amplify.yml file if it exists', async () => {
    (fs.readFile as jest.Mock).mockResolvedValue(mockBuildSpec);

    await updateAmplifyYmlFile(amplifyClient, mockAppId);

    expect(fs.readFile).toHaveBeenCalledWith(amplifyYmlPath, 'utf-8');
    expect(fs.writeFile).toHaveBeenCalledWith(amplifyYmlPath, mockBuildSpec.replace(new RegExp(GEN1_COMMAND, 'g'), GEN2_COMMAND), {
      encoding: 'utf-8',
    });
  });

  it('should create amplify.yml file with updated buildSpec if it does not exist', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
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
    (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
    (AmplifyClient.prototype.send as jest.Mock).mockResolvedValue({
      app: {},
    });

    await expect(updateAmplifyYmlFile(amplifyClient, mockAppId)).resolves.not.toThrow();
  });

  it('should throw an error if app is not found', async () => {
    (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
    (AmplifyClient.prototype.send as jest.Mock).mockResolvedValue({});

    await expect(updateAmplifyYmlFile(amplifyClient, mockAppId)).rejects.toThrow('App not found');
  });

  it('should throw the original error if it is not related to file not found', async () => {
    const error = new Error('Some other error');
    (fs.readFile as jest.Mock).mockRejectedValue(error);

    await expect(updateAmplifyYmlFile(amplifyClient, mockAppId)).rejects.toThrow(error);
  });
});

describe('removeGen1ConfigurationFiles', () => {
  const sourceDir = 'src';
  const mockProjectConfig = {
    whyContinueWithGen1: 'Prefer not to answer',
    projectName: 'testgen1',
    version: '3.1',
    frontend: 'javascript',
    javascript: {
      framework: 'none',
      config: {
        SourceDir: sourceDir,
        DistributionDir: 'dist',
        BuildCommand: 'npm run-script build',
        StartCommand: 'npm run-script start',
      },
    },
    providers: ['awscloudformation'],
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove all gen1 configuration files', async () => {
    jest.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockProjectConfig));

    await removeGen1ConfigurationFiles();

    GEN1_CONFIGURATION_FILES.forEach((file) => {
      expect(fs.rm).toHaveBeenCalledWith(`${sourceDir}/${file}`);
    });
  });

  it('should not throw an error when project-config json is not found', async () => {
    jest.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });

    await expect(removeGen1ConfigurationFiles()).resolves.not.toThrow();
    GEN1_CONFIGURATION_FILES.forEach((file) => {
      expect(fs.rm).not.toHaveBeenCalledWith(`${sourceDir}/${file}`);
    });
  });

  it('should not throw an error when a configuration file is not found', async () => {
    jest.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockProjectConfig));
    jest.mocked(fs.rm).mockRejectedValueOnce({ code: 'ENOENT' });

    await expect(removeGen1ConfigurationFiles()).resolves.not.toThrow();
    GEN1_CONFIGURATION_FILES.forEach((file) => {
      // making some other files are removed even if one errors out
      expect(fs.rm).toHaveBeenCalledWith(`${sourceDir}/${file}`);
    });
  });
});
