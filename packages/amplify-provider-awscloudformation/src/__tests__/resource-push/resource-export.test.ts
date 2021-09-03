import {
  $TSContext,
  CFNTemplateFormat,
  JSONUtilities,
  pathManager,
  readCFNTemplate,
  stateManager,
  writeCFNTemplate,
} from 'amplify-cli-core';
import { DeploymentResources, ResourceDeployType } from '../../resource-push/Types';
import * as fs from 'fs-extra';

const mockMeta = jest.fn(() => {
  return {
    providers: {
      awscloudformation: {
        AuthRoleName: 'amplify-amplifyexportest-dev-172019-authRole',
        Region: 'us-east-2',
        DeploymentBucketName: 'amplify-amplifyexportest-dev-172019-deployment',
        UnauthRoleName: 'amplify-amplifyexportest-dev-172019-unauthRole',
        StackName: 'amplify-amplifyexportest-dev-172019',
      },
    },
  };
});

jest.mock('amplify-cli-core');
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getMeta = mockMeta;
stateManager_mock.getTeamProviderInfo = jest.fn().mockReturnValue({});
stateManager_mock.getLocalEnvInfo = jest.fn().mockReturnValue({ envName: 'dev' });

const pathManager_mock = pathManager as jest.Mocked<typeof pathManager>;
pathManager_mock.findProjectRoot = jest.fn().mockReturnValue('projectpath');
pathManager_mock.getBackendDirPath = jest.fn().mockReturnValue('backend');

const JSONUtilities_mock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;
JSONUtilities_mock.readJson.mockImplementation((pathToJson: string) => {
  if (pathToJson.includes('function') && pathToJson.includes('amplifyexportestlayer5f16d693')) {
    return lambdaTemplate;
  }
  if (pathToJson.includes('rootStackTemplate.json')) {
    return {
      Resources: {
        DeploymentBucket: {
          Properties: {},
        },
      },
      Parameters: {},
    } as unknown as Template;
  }
});
const readCFNTemplate_mock = readCFNTemplate as jest.MockedFunction<typeof readCFNTemplate>;
readCFNTemplate_mock.mockImplementation(async path => {
  if (path.includes('function') && path.includes('amplifyexportestlayer5f16d693')) {
    return {
      cfnTemplate: lambdaTemplate,
      templateFormat: CFNTemplateFormat.JSON,
    };
  }
  return {
    cfnTemplate: {
      Parameters: {},
      Resources: {
        LambdaFunction: {
          Properties: {},
        },
      },
    } as unknown as Template,
    templateFormat: CFNTemplateFormat.JSON,
  };
});

jest.mock('fs-extra');
const fs_mock = fs as jest.Mocked<typeof fs>;
fs_mock.existsSync.mockReturnValue(true);
fs_mock.lstatSync.mockImplementation((_path, _options) => {
  return {
    isDirectory: jest.fn().mockReturnValue(true),
  } as unknown as fs.Stats;
});

jest.mock('../../aws-utils/aws-s3', () => ({
  S3: {
    getInstance: jest.fn().mockReturnValue(mockS3Instance),
  },
}));
jest.mock('../../aws-utils/aws-cfn', () => ({
  Cloudformation: {},
}));
jest.mock('../../admin-modelgen', () => ({
  adminModelgen: {},
}));
jest.mock('../../display-helpful-urls', () => ({
  displayHelpfulURLs: jest.fn(),
}));
jest.mock('../../zip-util', () => ({
  downloadZip: mockdownloadZip,
}));

jest.mock('../../download-api-models', () => ({}));
jest.mock('../../graphql-transformer', () => ({}));
jest.mock('../../amplify-service-manager', () => ({}));
jest.mock('../../iterative-deployment', () => ({}));
jest.mock('../../utils/env-level-constructs', () => ({
  getNetworkResourceCfn: jest.fn().mockReturnValue({ Resources: { mocknetworkstack: {} } } as unknown as Template),
}));
jest.mock('../../utils/consolidate-apigw-policies', () => ({
  consolidateApiGatewayPolicies: mockconsolidateApiGatewayPolicies,
  loadApiWithPrivacyParams: jest.fn(),
}));
jest.mock('../../transform-graphql-schema', () => ({
  transformGraphQLSchema: mockTransformGql,
}));

const mockconsolidateApiGatewayPolicies = jest.fn(() => {
  return {
    APIGatewayAuthURL: 'mockURL',
  };
});
const mockdownloadZip = jest.fn();
const mockTransformGql = jest.fn();
const mockS3Instance = jest.fn();

const mockResource: DeploymentResources = {
  resourcesToBeCreated: [
    {
      build: true,
      service: 'Lambda',
      resourceName: 'amplifyexportest075e4736',
      category: 'function',
    },
    {
      service: 'LambdaLayer',
      build: true,
      resourceName: 'amplifyexportestlayer5f16d693',
      category: 'function',
    },
    {
      service: 'Cognito',
      resourceName: 'amplifyexportestf93dd5cb',
      category: 'auth',
    },
    {
      service: 'AppSync',
      resourceName: 'amplifyexportest',
      category: 'api',
    },
  ],
  resourcesToBeUpdated: [],
  resourcesToBeSynced: [],
  resourcesToBeDeleted: [],
  tagsUpdated: false,
  allResources: [
    {
      service: '',
      resourceName: 'awscloudformation',
      category: 'providers',
    },
    {
      build: true,
      service: 'Lambda',
      resourceName: 'amplifyexportest075e4736',
      category: 'function',
    },
    {
      service: 'LambdaLayer',
      build: true,
      resourceName: 'amplifyexportestlayer5f16d693',
      category: 'function',
    },
    {
      service: 'Cognito',
      resourceName: 'amplifyexportestf93dd5cb',
      category: 'auth',
    },
    {
      service: 'Cognito-UserPool-Groups',
      resourceName: 'userPoolGroups',
      category: 'auth',
    },
    {
      resourceName: 'containerf763043d',
      build: true,
      service: 'ElasticContainer',
      category: 'api',
    },
    {
      service: 'AppSync',
      resourceName: 'amplifyexportest',
      category: 'api',
    },
  ],
};

jest.mock('glob', () => ({
  sync: mockGlobSync,
}));

const mockGlobSync = jest.fn((_, { cwd }) => [path.join(cwd, 'cfntemplate.json')]);
const lambdaTemplate = {
  Resources: {
    LambdaLayerVersionb8059db0: {
      Type: 'AWS::Lambda::LayerVersion',
      Properties: {
        Content: {
          S3Bucket: {
            Ref: 'deploymentBucketName',
          },
          S3Key: {
            Ref: 's3Key',
          },
        },
      },
    },
    LambdaLayerVersiond8833c37: {
      Type: 'AWS::Lambda::LayerVersion',
      Properties: {
        Content: {
          S3Bucket: {
            Ref: 'deploymentBucketName',
          },
          S3Key: 'amplify-builds/amplifyexportestlayera55b1f6d-LambdaLayerVersiond8833c37-build.zip',
        },
      },
    },
  },
};

const invokePluginMethod = jest.fn((_context, _category, _service, functionName, _others) => {
  if (functionName === 'buildResource') {
    return 'mockbuildTimeStamp';
  }
  if (functionName === 'packageResource') {
    return {
      newPackageCreated: true,
      zipFilename: 'mockZipFileName.zip',
      zipFilePath: 'mockZipFilePath.zip',
    };
  }
  if (functionName === 'generateContainersArtifacts') {
    return {
      exposedContainer: 'mockExposedContainer',
    };
  }
});
jest.mock('../../resourceParams', () => ({
  loadResourceParameters: jest.fn().mockReturnValue({}),
}));
import path from 'path';
import { ResourceExport } from '../../resource-push/ResourceExport';
import { Template } from 'cloudform-types';

describe.only('test resource export', () => {
  const exportPath = './exportPath';
  const mockContext = {
    amplify: {
      invokePluginMethod: invokePluginMethod,
      getEnvInfo: stateManager_mock.getLocalEnvInfo,
      getBackendDirPath: pathManager_mock.getBackendDirPath,
    },
    parameters: { options: {} },
    exeInfo: {
      localEnvInfo: {
        envName: 'dev',
      },
    },
  } as unknown as $TSContext;

  let resourceExport: ResourceExport;

  beforeAll(() => {
    resourceExport = new ResourceExport(mockContext, exportPath);
  });

  test('resource Export is defined', async () => {
    expect(resourceExport).toBeDefined();
    expect(resourceExport.deployType).toEqual(ResourceDeployType.Export);
    expect(mockMeta).toBeCalledTimes(1);
    const packagedResources = await resourceExport.packageBuildWriteResources(mockResource);
    expect(packagedResources).not.toContain({
      service: '',
      resourceName: 'awscloudformation',
      category: 'providers',
    });

    let invokePluginCount: number = 1;
    const resourcesWithoutProvider = mockResource.allResources.filter(r => r.category !== 'providers');
    resourcesWithoutProvider
      .filter(r => r.service === 'LambdaLayer')
      .forEach(resource => {
        expect(invokePluginMethod).nthCalledWith(invokePluginCount, mockContext, resource.category, 'LambdaLayer', 'migrateLegacyLayer', [
          mockContext,
          resource.resourceName,
        ]);
        invokePluginCount++;
      });

    expect(invokePluginMethod).nthCalledWith(invokePluginCount, mockContext, 'function', 'LambdaLayer', 'lambdaLayerPrompt', [
      mockContext,
      resourcesWithoutProvider,
    ]);
    invokePluginCount++;

    resourcesWithoutProvider
      .filter(r => r.build)
      .forEach(resource => {
        expect(invokePluginMethod).nthCalledWith(invokePluginCount, mockContext, 'function', resource.service, 'buildResource', [
          mockContext,
          resource,
        ]);
        invokePluginCount = invokePluginCount + 1;
      });

    const mockBuiltResources = resourcesWithoutProvider.map(resource => {
      if (resource.build) {
        return {
          ...resource,
          lastBuildTimeStamp: 'mockbuildTimeStamp',
        };
      }
      return resource;
    });

    mockBuiltResources
      .filter(resource => resource.build)
      .forEach(resource => {
        expect(invokePluginMethod).nthCalledWith(invokePluginCount, mockContext, 'function', resource.service, 'packageResource', [
          mockContext,
          resource,
          true,
        ]);
        invokePluginCount = invokePluginCount + 1;
      });

    expect(mockTransformGql).toBeCalledTimes(1);

    await resourceExport.writeResourcesToDestination(packagedResources);

    let copyCount = 1;
    packagedResources.forEach(resource => {
      if (resource.packagerParams) {
        expect(fs_mock.copy).nthCalledWith(
          copyCount++,
          resource.packagerParams.zipFilePath,
          path.join(exportPath, resource.category, resource.resourceName, 'amplify-builds', resource.packagerParams.zipFilename),
          { overwrite: true, preserveTimestamps: true, recursive: true },
        );
      }

      if (resource.service === 'LambdaLayer') {
        expect(mockdownloadZip).toBeCalledWith(
          mockS3Instance,
          path.join(exportPath, resource.category, resource.resourceName),
          'amplify-builds/amplifyexportestlayera55b1f6d-LambdaLayerVersiond8833c37-build.zip',
          'dev',
        );
      }

      if (resource.service === 'AppSync') {
        const folders = ['functions', 'pipelineFunctions', 'resolvers', 'stacks', 'schema.graphql'];
        expect(fs_mock.copy).nthCalledWith(
          copyCount++,
          path.join('backend', resource.category, resource.resourceName, 'build', 'functions'),
          path.join(exportPath, resource.category, resource.resourceName, 'amplify-appsync-files', 'functions'),
          { overwrite: true, preserveTimestamps: true, recursive: true },
        );
        expect(fs_mock.copy).nthCalledWith(
          copyCount++,
          path.join('backend', resource.category, resource.resourceName, 'build', 'pipelineFunctions'),
          path.join(exportPath, resource.category, resource.resourceName, 'amplify-appsync-files', 'pipelineFunctions'),
          { overwrite: true, preserveTimestamps: true, recursive: true },
        );
        expect(fs_mock.copy).nthCalledWith(
          copyCount++,
          path.join('backend', resource.category, resource.resourceName, 'build', 'resolvers'),
          path.join(exportPath, resource.category, resource.resourceName, 'amplify-appsync-files', 'resolvers'),
          { overwrite: true, preserveTimestamps: true, recursive: true },
        );
        expect(fs_mock.copy).nthCalledWith(
          copyCount++,
          path.join('backend', resource.category, resource.resourceName, 'build', 'stacks'),
          path.join(exportPath, resource.category, resource.resourceName, 'amplify-appsync-files', 'stacks'),
          { overwrite: true, preserveTimestamps: true, recursive: true },
        );
        expect(fs_mock.copy).nthCalledWith(
          copyCount++,
          path.join('backend', resource.category, resource.resourceName, 'build', 'schema.graphql'),
          path.join(exportPath, resource.category, resource.resourceName, 'amplify-appsync-files', 'schema.graphql'),
          { overwrite: true, preserveTimestamps: true, recursive: true },
        );
      }

      if (resource.service === 'Cognito') {
        expect(fs_mock.copy).nthCalledWith(
          copyCount++,
          path.join('backend', resource.category, resource.resourceName, 'assets'),
          path.join(exportPath, resource.category, resource.resourceName, 'amplify-auth-assets'),
          { overwrite: true, preserveTimestamps: true, recursive: true },
        );
      }
    });

    if (packagedResources.some(r => r.service === 'ElasticContainer')) {
      expect(fs_mock.copy).nthCalledWith(
        copyCount++,
        path.join(__dirname, '../../../', 'resources', 'custom-resource-pipeline-awaiter.zip'),
        path.join(exportPath, 'amplify-auxiliary-files', 'custom-resource-pipeline-awaiter.zip'),
        {
          overwrite: true,
          preserveTimestamps: true,
          recursive: true,
        },
      );
      expect(fs_mock.copy).nthCalledWith(
        copyCount++,
        path.join(__dirname, '../../../', 'resources', 'codepipeline-action-buildspec-generator-lambda.zip'),
        path.join(exportPath, 'amplify-auxiliary-files', 'codepipeline-action-buildspec-generator-lambda.zip'),
        {
          overwrite: true,
          preserveTimestamps: true,
          recursive: true,
        },
      );
    }
    const { stackParameters, transformedResources } = await resourceExport.generateAndTransformCfnResources(packagedResources);
    expect(stackParameters).toBeDefined();
    expect(transformedResources).toBeDefined();
    expect(mockconsolidateApiGatewayPolicies).toBeCalledWith(mockContext, 'amplify-amplifyexportest-dev-172019');

    expect(invokePluginMethod).nthCalledWith(invokePluginCount++, mockContext, 'auth', undefined, 'prePushAuthHook', [mockContext]);
    const apiResource = packagedResources.find(r => r.service === 'ElasticContainer');
    expect(invokePluginMethod).nthCalledWith(invokePluginCount++, mockContext, 'api', undefined, 'generateContainersArtifacts', [
      mockContext,
      apiResource,
    ]);
    const parameters = await resourceExport.generateAndWriteRootStack(stackParameters);

    expect(Object.keys(parameters).length).toBeLessThan(2);
  });
});
