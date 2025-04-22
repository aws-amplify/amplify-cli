import fs from 'node:fs/promises';
import path from 'node:path';

import { AmplifyClient, GetAppCommand } from '@aws-sdk/client-amplify';
import {
  updateAmplifyYmlFile,
  updateCustomResources,
  updateCdkStackFile,
  getProjectInfo,
  removeGen1ConfigurationFiles,
  GEN1_CONFIGURATION_FILES,
  getAuthTriggersConnections,
  executeStackRefactor,
  revertGen2Migration,
} from './command-handlers';
import { pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { ResourceMapping, TemplateGenerator } from '@aws-amplify/migrate-template-gen';
import { printer } from './printer';

jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  rm: jest.fn(),
  mkdir: jest.fn(),
  cp: jest.fn(),
  rename: jest.fn(),
}));

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  pathManager: {
    findProjectRoot: jest.fn(),
  },
  stateManager: {
    getMeta: jest.fn(),
    getResourceInputsJson: jest.fn(),
    getCurrentRegion: jest.fn(),
  },
  AmplifyCategories: {
    AUTH: 'auth',
  },
}));

jest.mock('@aws-sdk/client-cloudformation');
jest.mock('@aws-sdk/client-ssm');
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('@aws-sdk/client-sts');
jest.mock('@aws-amplify/migrate-template-gen');
jest.mock('./printer');

const actualUpdateCdkStackFile = jest.requireActual('./command-handlers').updateCdkStackFile;
const actualGetProjectInfoFile = jest.requireActual('./command-handlers').getProjectInfo;

// Mock the internal methods
jest.mock('./command-handlers', () => ({
  ...jest.requireActual('./command-handlers'),
  updateCdkStackFile: jest.fn(),
  getProjectInfo: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

jest.mock('@aws-amplify/cli-internal', () => ({
  UsageData: {
    Instance: {
      init: jest.fn(),
      emitSuccess: jest.fn(),
      emitError: jest.fn(),
    },
  },
}));

jest.mock('@aws-sdk/client-amplify');

const generateMock = jest.fn().mockResolvedValue(true);
const revertMock = jest.fn().mockResolvedValue(true);

jest.mocked(TemplateGenerator).mockImplementation(
  () =>
    ({
      generate: generateMock,
      revert: revertMock,
    } as unknown as TemplateGenerator),
);

const mockAccountId = '123456789012';
jest.requireMock('@aws-sdk/client-sts').GetCallerIdentityCommand = jest.fn();
jest.requireMock('@aws-sdk/client-sts').STSClient.prototype.send = jest.fn().mockResolvedValue({
  Account: mockAccountId,
});

const GEN1_COMMAND = 'amplifyPush --simple';
const GEN2_COMMAND = 'npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID';

const mockFromStack = 'mockFromStack';
const mockToStack = 'mockToStack';
const mockEnvName = 'mockEnvName';
const mockAppId = 'mockAppId';
const mockGen1MetaContent = JSON.stringify({
  providers: {
    awscloudformation: {
      AmplifyAppId: mockAppId,
      StackName: `amplify-stack-${mockEnvName}`,
    },
  },
});
const mockFsReadFileForRefactorOperations = (filePath: unknown) => {
  if (typeof filePath === 'string' && filePath.includes('amplify-meta.json')) {
    return Promise.resolve(mockGen1MetaContent);
  }
  return Promise.resolve('{}');
};

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

describe('removeGen1ConfigurationFiles', () => {
  const sourceDir = 'src';
  const mockProjectConfigString = JSON.stringify({
    whyContinueWithGen1: 'Prefer not to answer',
    projectName: 'testgen1',
    version: '3.1',
    frontend: 'javascript',
    javascript: {
      framework: 'none',
      config: {
        SourceDir: sourceDir,
        DistributionDir: 'dist',
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should remove all gen1 configuration files', async () => {
    jest.mocked(fs.readFile).mockResolvedValue(mockProjectConfigString);

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
    jest.mocked(fs.readFile).mockResolvedValue(mockProjectConfigString);
    jest.mocked(fs.rm).mockRejectedValueOnce({ code: 'ENOENT' });

    await expect(removeGen1ConfigurationFiles()).resolves.not.toThrow();
    GEN1_CONFIGURATION_FILES.forEach((file) => {
      // making some other files are removed even if one errors out
      expect(fs.rm).toHaveBeenCalledWith(`${sourceDir}/${file}`);
    });
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

describe('getAuthTriggersConnections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty object when no auth resources exist', async () => {
    jest.mocked(stateManager.getMeta).mockReturnValue({});

    const result = await getAuthTriggersConnections();

    expect(result).toEqual({});
  });

  it('should return empty object when auth resource exists but no trigger connections', async () => {
    jest.mocked(stateManager.getMeta).mockReturnValue({
      auth: {
        myAuthResource: {
          service: 'Cognito',
          providerPlugin: 'awscloudformation',
        },
      },
    });

    jest.mocked(stateManager.getResourceInputsJson).mockReturnValue({
      cognitoConfig: {},
    });

    const result = await getAuthTriggersConnections();

    expect(result).toEqual({});
  });

  it('should parse authTriggerConnections when provided as JSON string', async () => {
    jest.mocked(stateManager.getMeta).mockReturnValue({
      auth: {
        myAuthResource: {
          service: 'Cognito',
          providerPlugin: 'awscloudformation',
        },
      },
    });

    const mockTriggerConnections = JSON.stringify([
      {
        triggerType: 'PreSignUp',
        lambdaFunctionName: 'myPreSignUpFunction',
      },
      {
        triggerType: 'PostConfirmation',
        lambdaFunctionName: 'myPostConfirmationFunction',
      },
    ]);

    jest.mocked(stateManager.getResourceInputsJson).mockReturnValue({
      cognitoConfig: {
        authTriggerConnections: mockTriggerConnections,
      },
    });

    const result = await getAuthTriggersConnections();

    expect(result).toEqual({
      PreSignUp: 'amplify/backend/function/myPreSignUpFunction/src',
      PostConfirmation: 'amplify/backend/function/myPostConfirmationFunction/src',
    });
  });

  it('should parse authTriggerConnections when provided as array of JSON strings', async () => {
    jest.mocked(stateManager.getMeta).mockReturnValue({
      auth: {
        myAuthResource: {
          service: 'Cognito',
          providerPlugin: 'awscloudformation',
        },
      },
    });

    const mockTriggerConnections = [
      JSON.stringify({
        triggerType: 'PreSignUp',
        lambdaFunctionName: 'myPreSignUpFunction',
      }),
      JSON.stringify({
        triggerType: 'PostConfirmation',
        lambdaFunctionName: 'myPostConfirmationFunction',
      }),
    ];

    jest.mocked(stateManager.getResourceInputsJson).mockReturnValue({
      cognitoConfig: {
        authTriggerConnections: mockTriggerConnections,
      },
    });

    const result = await getAuthTriggersConnections();

    expect(result).toEqual({
      PreSignUp: 'amplify/backend/function/myPreSignUpFunction/src',
      PostConfirmation: 'amplify/backend/function/myPostConfirmationFunction/src',
    });
  });

  it('should handle triggers defined directly in cognitoConfig', async () => {
    jest.mocked(stateManager.getMeta).mockReturnValue({
      auth: {
        myAuthResource: {
          service: 'Cognito',
          providerPlugin: 'awscloudformation',
        },
      },
    });

    jest.mocked(stateManager.getResourceInputsJson).mockReturnValue({
      cognitoConfig: {
        triggers: {
          PreSignUp: true,
          PostConfirmation: true,
        },
      },
    });

    const result = await getAuthTriggersConnections();

    expect(result).toEqual({
      PreSignUp: 'amplify/backend/function/myAuthResourcePreSignUp/src',
      PostConfirmation: 'amplify/backend/function/myAuthResourcePostConfirmation/src',
    });
  });

  it('should throw error when authTriggerConnections is invalid', async () => {
    jest.mocked(stateManager.getMeta).mockReturnValue({
      auth: {
        myAuthResource: {
          service: 'Cognito',
          providerPlugin: 'awscloudformation',
        },
      },
    });

    jest.mocked(stateManager.getResourceInputsJson).mockReturnValue({
      cognitoConfig: {
        authTriggerConnections: 'invalid-json',
      },
    });

    await expect(getAuthTriggersConnections()).rejects.toThrow('Error parsing auth trigger connections');
  });
});

describe('updateCdkStackFile', () => {
  const mockCustomResources = ['resource1'];
  const mockCustomResourcesPath = 'amplify-gen2/amplify/custom';
  const mockProjectRoot = '/mockRootDir';

  const originalCdkContentWithError = `
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

  const originalCdkContentWithoutError = `
      import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
      import * as cdk from 'aws-cdk-lib';
      
      export class cdkStack extends cdk.Stack {
        constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
          super(scope, id, props);
          
          const projectInfo = AmplifyHelpers.getProjectInfo();
          /* AmplifyHelpers.addResourceDependency(this, 
            {
              category: "custom",
              resourceName: "customResource1",
            },
            {
              category: "auth",
              resourceName: "authResource1",
            }
          ); */
        }
      }
    `;

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

  test.each([
    [originalCdkContentWithError, true],
    [originalCdkContentWithoutError, false],
  ])('should correctly transform CDK stack file content', async (originalCdkContent, shouldThrowError) => {
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
    if (shouldThrowError) {
      expect(transformedContent).toContain(
        "throw new Error('Follow https://docs.amplify.aws/react/start/migrate-to-gen2/ to update the resource dependency')",
      );
    } // Error added
    expect(transformedContent).toContain("const projectInfo = {envName: `${AMPLIFY_GEN_1_ENV_NAME}`, projectName: 'testProject'}"); // Project info replaced
  });
});

describe('executeStackRefactor', () => {
  const mockFromStack = 'mockFromStack';
  const mockToStack = 'mockToStack';
  const mockResourceMappings: ResourceMapping[] = [
    {
      Source: { StackName: 'gen1Stack', LogicalResourceId: 'SourceLogicalId' },
      Destination: {
        StackName: 'gen2Stack',
        LogicalResourceId: 'DestinationLogicalId',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(fs.readFile).mockImplementation(mockFsReadFileForRefactorOperations);
  });

  it('should initialize TemplateGenerator with correct parameters and call generate', async () => {
    await executeStackRefactor(mockFromStack, mockToStack, mockResourceMappings);

    // Verify TemplateGenerator was initialized correctly
    expect(TemplateGenerator).toHaveBeenCalledWith(
      mockFromStack,
      mockToStack,
      mockAccountId,
      expect.any(CloudFormationClient),
      expect.any(SSMClient),
      expect.any(CognitoIdentityProviderClient),
      mockAppId,
      mockEnvName,
    );

    expect(generateMock).toHaveBeenCalledWith(mockResourceMappings);
    expect(generateMock).toHaveBeenCalledTimes(1);

    expect(printer.print).toHaveBeenCalled();
  });

  it('should handle errors when generate fails', async () => {
    jest.mocked(TemplateGenerator).mockImplementationOnce(
      () =>
        ({
          generate: jest.fn().mockResolvedValue(false),
          revert: jest.fn(),
        } as unknown as TemplateGenerator),
    );

    await executeStackRefactor(mockFromStack, mockToStack);

    const mockUsageData = jest.requireMock('@aws-amplify/cli-internal').UsageData.Instance;
    expect(mockUsageData.emitError).toHaveBeenCalled();
    expect(mockUsageData.emitSuccess).not.toHaveBeenCalled();
  });

  it('should work without resource mappings', async () => {
    await executeStackRefactor(mockFromStack, mockToStack);

    expect(generateMock).toHaveBeenCalledWith(undefined);
    expect(generateMock).toHaveBeenCalledTimes(1);
  });
});

describe('revertGen2Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(fs.readFile).mockImplementation(mockFsReadFileForRefactorOperations);
  });

  it('should initialize TemplateGenerator with correct parameters and call revert', async () => {
    await revertGen2Migration(mockFromStack, mockToStack);

    expect(TemplateGenerator).toHaveBeenCalledWith(
      mockFromStack,
      mockToStack,
      mockAccountId,
      expect.any(CloudFormationClient),
      expect.any(SSMClient),
      expect.any(CognitoIdentityProviderClient),
      mockAppId,
      mockEnvName,
    );

    expect(revertMock).toHaveBeenCalledTimes(1);
    expect(printer.print).toHaveBeenCalled();
    expect(fs.rm).toHaveBeenCalledWith('amplify', { force: true, recursive: true });
    expect(fs.rename).toHaveBeenCalledWith('.amplify/migration/amplify', 'amplify');
  });

  it('should handle errors when revert fails', async () => {
    jest.mocked(TemplateGenerator).mockImplementationOnce(
      () =>
        ({
          generate: jest.fn(),
          revert: jest.fn().mockResolvedValue(false),
        } as unknown as TemplateGenerator),
    );

    await revertGen2Migration(mockFromStack, mockToStack);

    const mockUsageData = jest.requireMock('@aws-amplify/cli-internal').UsageData.Instance;
    expect(mockUsageData.emitError).toHaveBeenCalled();
    expect(mockUsageData.emitSuccess).not.toHaveBeenCalled();
    expect(fs.rm).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });
});
