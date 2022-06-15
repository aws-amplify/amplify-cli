import { hashElement } from 'folder-hash';
import * as fs from 'fs-extra';
import { stateManager } from 'amplify-cli-core';
import { hashLayerResource } from 'amplify-category-function';
import { NotInitializedError } from '../../../../../amplify-cli-core/lib';
import { print } from '../../../extensions/amplify-helpers/print';
import { getEnvInfo } from '../../../extensions/amplify-helpers/get-env-info';
import { getHashForResourceDir, getResourceStatus, showResourceTable } from '../../../extensions/amplify-helpers/resource-status';
import {
  CLOUD_INITIALIZED,
  CLOUD_NOT_INITIALIZED,
  NON_AMPLIFY_PROJECT,
  getCloudInitStatus,
} from '../../../extensions/amplify-helpers/get-cloud-init-status';
import { cronJobSetting } from '../../../../../amplify-category-function/lib/provider-utils/awscloudformation/utils/constants';

const sample_hash1 = 'testhash1';
const sample_hash2 = 'testhash2';

const stateManagerMock = stateManager as jest.Mocked<typeof stateManager>;

jest.mock('folder-hash', () => ({
  hashElement: jest.fn().mockImplementation(async () => ({
    hash: sample_hash1,
  })),
}));

jest.mock('chalk', () => ({
  green: jest.fn().mockImplementation(input => input),
  yellow: jest.fn().mockImplementation(input => input),
  red: jest.fn().mockImplementation(input => input),
  blue: jest.fn().mockImplementation(input => input),
  gray: jest.fn().mockImplementation(input => input),
  grey: jest.fn().mockImplementation(input => input),
  bgRgb: jest.fn().mockImplementation(input => input),
  blueBright: jest.fn().mockImplementation(input => input),
  greenBright: jest.fn().mockImplementation(input => input),
}));

jest.mock('../../../extensions/amplify-helpers/print', () => ({
  print: {
    info: jest.fn(),
    table: jest.fn(),
  },
}));

jest.mock('../../../extensions/amplify-helpers/get-env-info', () => ({
  getEnvInfo: jest.fn(),
}));

jest.mock('../../../extensions/amplify-helpers/get-cloud-init-status', () => ({
  ...(jest.requireActual('../../../extensions/amplify-helpers/get-cloud-init-status') as {}),
  getCloudInitStatus: jest.fn(),
}));

jest.mock('../../../extensions/amplify-helpers/root-stack-status', () => ({
  isRootStackModifiedSinceLastPush: jest.fn().mockResolvedValue(false),
}));

const backendDirPathStub = 'backendDirPath';
const currentBackendDirPathStub = 'currentBackendDirPathStub';
const projectRootPath = 'projectRootPath';

jest.mock('amplify-cli-core', () => ({
  ...(jest.requireActual('amplify-cli-core') as {}),
  stateManager: {
    getCurrentMeta: jest.fn(),
    getMeta: jest.fn(),
    getProjectTags: jest.fn(),
    getCurrentProjectTags: jest.fn(),
    getBackendConfig: jest.fn(),
    getProjectConfig: jest.fn(),
  },
  pathManager: {
    getBackendDirPath: jest.fn(() => backendDirPathStub),
    getCurrentCloudBackendDirPath: jest.fn(() => currentBackendDirPathStub),
    findProjectRoot: jest.fn(() => projectRootPath),
  },
  FeatureFlags: {
    getBoolean: jest.fn().mockReturnValue(true),
  },
}));

jest.mock('amplify-category-function', () => ({
  ...(jest.requireActual('amplify-category-function') as {}),
  hashLayerResource: jest.fn(),
}));

const mockProjectConfig = {
  projectName: 'mockProjectName',
  version: '2.0',
  frontend: 'javascript',
  javascript: {
    framework: 'none',
    config: {
      SourceDir: 'src',
      DistributionDir: 'dist',
      BuildCommand: 'npm run-script build',
      StartCommand: 'npm run-script start',
    },
  },
  providers: ['awscloudformation'],
};

describe('resource-status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stateManagerMock.getCurrentMeta.mockReturnValue({});
    stateManagerMock.getMeta.mockReturnValue({
      providers: {
        awscloudformation: {},
      },
    });
    stateManagerMock.getProjectTags.mockReturnValue([]);
    stateManagerMock.getCurrentProjectTags.mockReturnValue([]);
    stateManagerMock.getBackendConfig.mockReturnValue({});
    stateManagerMock.getProjectConfig.mockReturnValue(mockProjectConfig);

    (getEnvInfo as jest.MockedFunction<typeof getEnvInfo>).mockReturnValue({ envName: 'test' });
    (getCloudInitStatus as jest.MockedFunction<typeof getCloudInitStatus>).mockImplementation(() => CLOUD_INITIALIZED);
    const hashLayerResourceMock = hashLayerResource as jest.MockedFunction<typeof hashLayerResource>;
    hashLayerResourceMock.mockClear();
  });

  describe('getHashForResourceDir', () => {
    it('returns hash excludes dotfiles, node_modules, test_coverage, dist and build directories', async () => {
      const testDirName = 'test';
      const files = ['resource.js'];
      const hash = await getHashForResourceDir(testDirName, files);

      const expected = sample_hash1;
      expect(hash).toBe(expected);

      expect(hashElement).toBeCalledWith(testDirName, {
        folders: { exclude: ['.*', 'node_modules', 'test_coverage', 'dist', 'build'] },
        files: {
          include: files,
        },
      });
    });
  });

  describe('getResourceStatus', () => {
    it('returns empty arrays excluding allResources when immediately after initialized', async () => {
      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [],
        rootStackUpdated: false,
        tagsUpdated: false,
      });
    });

    it('returns resourcesToBeCreated including it when resources only exists on local metadata', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambda1: {
            service: 'Lambda',
          },
        },
      });
      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
          {
            category: 'function',
            resourceName: 'lambda1',
            service: 'Lambda',
          },
        ],
        resourcesToBeCreated: [
          {
            category: 'function',
            resourceName: 'lambda1',
            service: 'Lambda',
          },
        ],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns resourcesToBeCreated including it and dependencies resources and when resources only exists on local metadata', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambda1: {
            service: 'Lambda',
            dependsOn: [
              {
                category: 'storage',
                resourceName: 's3Bucket',
              },
            ],
          },
        },
        storage: {
          s3Bucket: {
            service: 'S3',
          },
        },
      });
      const status = await getResourceStatus('function');
      expect(status).toEqual({
        allResources: [
          {
            category: 'function',
            resourceName: 'lambda1',
            service: 'Lambda',
            dependsOn: [
              {
                category: 'storage',
                resourceName: 's3Bucket',
              },
            ],
          },
        ],
        resourcesToBeCreated: [
          {
            category: 'function',
            resourceName: 'lambda1',
            service: 'Lambda',
            dependsOn: [
              {
                category: 'storage',
                resourceName: 's3Bucket',
              },
            ],
          },
          {
            category: 'storage',
            resourceName: 's3Bucket',
            service: 'S3',
          },
        ],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns resourcesToBeDeleted including it when resources only exists on current cloud', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambda1: {
            service: 'Lambda',
          },
        },
      });
      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [
          {
            category: 'function',
            resourceName: 'lambda1',
            service: 'Lambda',
          },
        ],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns marked resource as sync import including in resourcesToBeSynced when imported resource only exists on local metadata', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
      });

      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
          {
            category: 'auth',
            providerPlugin: 'awscloudformation',
            resourceName: 'authResourceName',
            service: 'Cognito',
            serviceType: 'imported',
            sync: 'import',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [
          {
            category: 'auth',
            providerPlugin: 'awscloudformation',
            resourceName: 'authResourceName',
            service: 'Cognito',
            serviceType: 'imported',
            sync: 'import',
          },
        ],
        resourcesToBeUpdated: [],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns marked resource as sync unlink including in resourcesToBeSynced when imported resource only exists on current cloud', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      });

      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [
          {
            category: 'auth',
            providerPlugin: 'awscloudformation',
            resourceName: 'authResourceName',
            service: 'Cognito',
            serviceType: 'imported',
            sync: 'unlink',
          },
        ],
        resourcesToBeUpdated: [],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns marked resource as sync refresh including in resourcesToBeSynced when imported resource both exists on local and current cloud', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      });

      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
          {
            category: 'auth',
            providerPlugin: 'awscloudformation',
            resourceName: 'authResourceName',
            service: 'Cognito',
            serviceType: 'imported',
            sync: 'refresh',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [
          {
            category: 'auth',
            providerPlugin: 'awscloudformation',
            resourceName: 'authResourceName',
            service: 'Cognito',
            serviceType: 'imported',
            sync: 'refresh',
          },
        ],
        resourcesToBeUpdated: [],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns resourcesToBeUpdated including updated resource when updated resources exists on local metadata', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambda1: {
            service: 'Lambda',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
          },
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambda1: {
            service: 'Lambda',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
          },
        },
      });

      const fsMock = fs as jest.Mocked<typeof fs>;
      fsMock.existsSync.mockReturnValue(true);
      const hashElementMock = hashElement as jest.MockedFunction<typeof hashElement>;
      hashElementMock.mockImplementation(async () => ({
        hash: sample_hash1,
      }));
      hashElementMock.mockImplementationOnce(async () => ({
        hash: sample_hash2,
      }));

      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
          {
            category: 'function',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
            resourceName: 'lambda1',
            service: 'Lambda',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [
          {
            category: 'function',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
            resourceName: 'lambda1',
            service: 'Lambda',
          },
        ],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns resourcesToBeUpdated including updated lambda layer resources when updated lambda layer resources exists on local metadata', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambdaLayer1: {
            service: 'LambdaLayer',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
          },
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambdaLayer1: {
            service: 'LambdaLayer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
          },
        },
      });

      const hashLayerResourceMock = hashLayerResource as jest.MockedFunction<typeof hashLayerResource>;
      hashLayerResourceMock.mockResolvedValueOnce('hash_one');
      hashLayerResourceMock.mockResolvedValueOnce('hash_two');

      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
          {
            category: 'function',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
            resourceName: 'lambdaLayer1',
            service: 'LambdaLayer',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [
          {
            category: 'function',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
            resourceName: 'lambdaLayer1',
            service: 'LambdaLayer',
          },
        ],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns resourcesToBeUpdated including updated hosting resources on ECS when updated docker files', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        hosting: {
          site: {
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
          },
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        hosting: {
          site: {
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
            lastPushDirHash: '83Bhmmec48dILMj3mi2T25B4700=',
          },
        },
      });

      const status = await getResourceStatus();

      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
          {
            category: 'hosting',
            resourceName: 'site',
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [
          {
            category: 'hosting',
            resourceName: 'site',
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
          },
        ],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns filtered resources when specify providerName parameter', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        hosting: {
          site: {
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
            providerPlugin: 'awscloudformation',
          },
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        hosting: {
          site: {
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
            lastPushDirHash: '83Bhmmec48dILMj3mi2T25B4700=',
            providerPlugin: 'awscloudformation',
          },
        },
      });

      const status = await getResourceStatus(undefined, undefined, 'awscloudformation');

      expect(status).toEqual({
        allResources: [
          {
            category: 'hosting',
            resourceName: 'site',
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
            providerPlugin: 'awscloudformation',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [
          {
            category: 'hosting',
            resourceName: 'site',
            service: 'ElasticContainer',
            lastPushTimeStamp: '2021-07-12T00:39:17.966Z',
            providerPlugin: 'awscloudformation',
          },
        ],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('returns tagsUpdated is true when updated tag exists', async () => {
      stateManagerMock.getProjectTags.mockReturnValue([
        {
          Key: 'Key1',
          Value: 'ValueA',
        },
      ]);
      stateManagerMock.getCurrentProjectTags.mockReturnValue([
        {
          Key: 'Key1',
          Value: 'ValueB',
        },
      ]);

      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [
          {
            category: 'providers',
            resourceName: 'awscloudformation',
          },
        ],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [],
        tagsUpdated: true,
        rootStackUpdated: false,
      });
    });

    it('returns empty arrays when non initialized', async () => {
      (getCloudInitStatus as jest.MockedFunction<typeof getCloudInitStatus>).mockReturnValue(CLOUD_NOT_INITIALIZED);

      const status = await getResourceStatus();
      expect(status).toEqual({
        allResources: [],
        resourcesToBeCreated: [],
        resourcesToBeDeleted: [],
        resourcesToBeSynced: [],
        resourcesToBeUpdated: [],
        tagsUpdated: false,
        rootStackUpdated: false,
      });
    });

    it('throws an error when non amplify project', async () => {
      (getCloudInitStatus as jest.MockedFunction<typeof getCloudInitStatus>).mockReturnValue(NON_AMPLIFY_PROJECT);
      expect(getResourceStatus()).rejects.toThrowError(NotInitializedError);
    });
  });

  describe('showResourceTable', () => {
    it('returns false and print empty markdown table format when no changed resources exists', async () => {
      const hasChanges = await showResourceTable();
      expect(hasChanges).toBe(false);
      expect(print.table).toBeCalledWith([['Category', 'Resource name', 'Operation', 'Provider plugin']], { format: 'lean' });
    });

    it('returns true and print resources as lean table format when any changed resources exists', async () => {
      stateManagerMock.getMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambda1: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
          },
          lambda2: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            lastPushTimeStamp: '2021-07-12T00:41:17.966Z',
          },
        },
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
        storage: {
          s3Bucket: {
            service: 'S3',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      });
      stateManagerMock.getCurrentMeta.mockReturnValue({
        providers: {
          awscloudformation: {},
        },
        function: {
          lambda2: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
          },
          lambda3: {
            service: 'Lambda',
            providerPlugin: 'awscloudformation',
            lastPushTimeStamp: '2021-07-12T00:40:17.966Z',
          },
        },
        storage: {
          s3Bucket: {
            service: 'S3',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
          testTable: {
            service: 'DynamoDB',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      });

      const fsMock = fs as jest.Mocked<typeof fs>;
      fsMock.existsSync.mockReturnValue(true);
      const hashElementMock = hashElement as jest.MockedFunction<typeof hashElement>;
      hashElementMock.mockImplementation(async () => ({
        hash: sample_hash1,
      }));
      hashElementMock.mockImplementationOnce(async () => ({
        hash: sample_hash2,
      }));

      const hasChanges = await showResourceTable();
      expect(hasChanges).toBe(true);
      expect(print.info).toBeCalledWith(`
    Current Environment: test
    `);
      expect(print.table).toBeCalledWith(
        [
          ['Category', 'Resource name', 'Operation', 'Provider plugin'],
          ['Function', 'lambda1', 'Create', 'awscloudformation'],
          ['Function', 'lambda2', 'Update', 'awscloudformation'],
          ['Auth', 'authResourceName', 'Import', 'awscloudformation'],
          ['Storage', 's3Bucket', 'No Change', 'awscloudformation'],
          ['Storage', 'testTable', 'Unlink', 'awscloudformation'],
          ['Function', 'lambda3', 'Delete', 'awscloudformation'],
        ],
        { format: 'lean' },
      );
    });
  });
});
