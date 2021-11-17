import { capitalize, globCFNFilePath, ResourceDiff, stackMutationType } from '../../../extensions/amplify-helpers/resource-status-diff';
import { CLOUD_INITIALIZED } from '../../../extensions/amplify-helpers/get-cloud-init-status';
import glob from 'glob';
import path from 'path';
import * as fs from 'fs-extra';
import { stateManager, pathManager } from 'amplify-cli-core';
import { cronJobSetting } from '../../../../../amplify-category-function/lib/provider-utils/awscloudformation/utils/constants';

//Mock Glob to fetch test cloudformation
jest.mock('glob');
const localBackendDirPathStub = 'localBackendDirPath';
const currentBackendDirPathStub = 'currentCloudBackendPath';
const testApiName = 'testApiName';
const globMock = glob as jest.Mocked<typeof glob>;
const allFiles: string[] = [
  'cloudformation-template.json',
  'parameters.json',
  'resolvers',
  'stacks',
  'functions',
  'pipelinesFunctions',
  'schema.graphql',
];
const templateMatchRegex = '.*template.(json|yaml|yml)$';
globMock.sync.mockImplementation(() => allFiles.filter(fname => fname.match(templateMatchRegex)));

//Mock fs to pass all file-system checks
jest.mock('fs-extra', () => ({
  ...(jest.requireActual('fs-extra') as {}),
  existsSync: jest.fn().mockImplementation(() => true),
  statSync: jest.fn().mockReturnValue({ isFile: () => true } as fs.Stats),
}));

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  FeatureFlags: {
    getBoolean: jest.fn(),
    getNumber: jest.fn(),
  },
}));

describe('resource-status-diff helpers', () => {
  beforeAll(() => {
    jest.unmock('amplify-cli-core');
  });

  it('capitalize should capitalize strings', async () => {
    const mockInput = 'abcd';
    const expectedOutput = 'Abcd';
    expect(capitalize(mockInput)).toBe(expectedOutput);
  });

  it('should Glob only cloudformation template files ', async () => {
    const mockCloudformationTemplateName = 'cloudformation-template.json';
    const stubFileFolder = 'stub-file-folder';
    const expectedGlobOptions = {
      absolute: false,
      cwd: stubFileFolder,
      follow: false,
      nodir: true,
    };

    const cfnFilename = globCFNFilePath(stubFileFolder);
    expect(globMock.sync.mock.calls.length).toBe(1);
    expect(globMock.sync).toBeCalledWith('**/*template.{yaml,yml,json}', expectedGlobOptions);
    expect(cfnFilename).toBe(`${stubFileFolder}/${mockCloudformationTemplateName}`);
  });

  it('should search both Build and non Build folders for Cloudformation Templates ', async () => {
    const mockGraphQLAPIMeta = {
      providers: {
        awscloudformation: {
          Region: 'myMockRegion',
        },
      },
      api: {
        [testApiName]: {
          service: 'AppSync',
        },
      },
    };

    //Enable cloud initialized to test updates , but retain all other functions
    jest.mock('../../../extensions/amplify-helpers/get-cloud-init-status', () => ({
      ...(jest.requireActual('../../../extensions/amplify-helpers/get-cloud-init-status') as {}),
      getCloudInitStatus: jest.fn().mockImplementation(() => CLOUD_INITIALIZED),
    }));

    //helper to mock common dependencies
    const setMockTestCommonDependencies = () => {
      jest.mock('amplify-cli-core');
      const pathManagerMock = pathManager as jest.Mocked<typeof pathManager>;
      pathManagerMock.getBackendDirPath = jest.fn().mockImplementation(() => localBackendDirPathStub);
      pathManagerMock.getCurrentCloudBackendDirPath = jest.fn().mockImplementation(() => currentBackendDirPathStub);

      const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;
      stateManagerMock.getMeta = jest.fn().mockImplementation(() => mockGraphQLAPIMeta);
      stateManagerMock.getCurrentMeta = jest.fn().mockImplementation(() => mockGraphQLAPIMeta);
    };

    const getMockInputData = () => {
      return {
        mockDefaultRootCfnTmpltName: 'cloudformation-template.json',
        mockCategory: 'api',
        mockResourceName: testApiName,
        mockProvider: 'awscloudformation',
        normalizedProvider: 'cloudformation',
        mockMutationInfo: stackMutationType.UPDATE,
      };
    };

    //Test mocks
    setMockTestCommonDependencies();
    const input = getMockInputData();

    /** 1. Code-Under-Test - constructor **/
    const resourceDiff = new ResourceDiff(input.mockCategory, input.mockResourceName, input.mockProvider, input.mockMutationInfo);

    //Test Definitions
    const checkProviderNormalization = () => {
      expect(resourceDiff.provider).toBe(input.normalizedProvider);
    };

    const checkCfnPaths = () => {
      const mockLocalPreBuildCfnFile = path.join(
        localBackendDirPathStub,
        input.mockCategory,
        input.mockResourceName,
        input.mockDefaultRootCfnTmpltName,
      );
      const mockCurrentPreBuildCfnFile = path.join(
        currentBackendDirPathStub,
        input.mockCategory,
        input.mockResourceName,
        input.mockDefaultRootCfnTmpltName,
      );
      const mockLocalPostBuildCfnFile = path.join(
        localBackendDirPathStub,
        input.mockCategory,
        input.mockResourceName,
        'build',
        input.mockDefaultRootCfnTmpltName,
      );
      const mockCurrentPostBuildCfnFile = path.join(
        currentBackendDirPathStub,
        input.mockCategory,
        input.mockResourceName,
        'build',
        input.mockDefaultRootCfnTmpltName,
      );
      expect(resourceDiff.resourceFiles.localPreBuildCfnFile).toBe(mockLocalPreBuildCfnFile);
      expect(resourceDiff.resourceFiles.cloudPreBuildCfnFile).toBe(mockCurrentPreBuildCfnFile);
      expect(resourceDiff.resourceFiles.localBuildCfnFile).toBe(mockLocalPostBuildCfnFile);
      expect(resourceDiff.resourceFiles.cloudBuildCfnFile).toBe(mockCurrentPostBuildCfnFile);
    };

    //Test Execution
    checkProviderNormalization();
    checkCfnPaths();
  });

  it('should show the diff between local and remote cloudformation ', async () => {
    const getMockInputData = () => {
      return {
        mockDefaultRootCfnTmpltName: 'cloudformation-template.json',
        mockCategory: 'api',
        mockResourceName: testApiName,
        mockProvider: 'awscloudformation',
        normalizedProvider: 'cloudformation',
        mockMutationInfo: stackMutationType.UPDATE,
      };
    };

    const input = getMockInputData();

    /** 1. Code-Under-Test - constructor **/
    const resourceDiff = new ResourceDiff(input.mockCategory, input.mockResourceName, input.mockProvider, input.mockMutationInfo);

    /** 2. Code-Under-Test calculateCfnDiff **/
    //update sample cloudformation paths in resourceDiff
    const localPath = `${__dirname}/testData/mockLocalCloud/cloudformation-template.json`;
    const cloudPath = `${__dirname}/testData/mockCurrentCloud/cloudformation-template.json`;
    //override paths to point to reference cloudformation templates
    resourceDiff.resourceFiles.localBuildCfnFile = localPath;
    resourceDiff.resourceFiles.cloudBuildCfnFile = cloudPath;
    resourceDiff.resourceFiles.localPreBuildCfnFile = localPath;
    resourceDiff.resourceFiles.cloudPreBuildCfnFile = cloudPath;
    const diff = await resourceDiff.calculateCfnDiff();
    expect(diff).toMatchSnapshot();
  });
});
