jest.mock('promise-sequential');
jest.mock('fs-extra');
jest.mock('../../lib/S3AndCloudFront/index');
const s3AndCFIndexModule = require('../../lib/S3AndCloudFront/index');

const fs = require('fs-extra');
const sequential = require('promise-sequential');

const categoryManager = require('../../lib/category-manager');

describe('category-manager', () => {
  const S3AndCloudFront = 'S3AndCloudFront';

  const mockBackendDirPath = 'mockBackendDirPath';

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

  const mockAmplifyMeta = {
    providers: {
      awscloudformation: {
        AuthRoleName: 'checkhosting-20190226163640-authRole',
        UnauthRoleArn: 'arn:aws:iam::mockAccountId:role/checkhosting-20190226163640-unauthRole',
        AuthRoleArn: 'arn:aws:iam::mockAccountId:role/checkhosting-20190226163640-authRole',
        Region: 'us-west-2',
        DeploymentBucketName: 'checkhosting-20190226163640-deployment',
        UnauthRoleName: 'checkhosting-20190226163640-unauthRole',
        StackName: 'checkhosting-20190226163640',
        StackId: 'arn:aws:cloudformation:us-west-2:mockAccountId:stack/checkhosting-20190226163640/2c061610-3a28-11e9-acf3-02ee71065ed8',
      },
    },
    hosting: {
      S3AndCloudFront: {
        service: 'S3AndCloudFront',
        providerPlugin: 'awscloudformation',
        providerMetadata: {
          s3TemplateURL: 'https://s3.amazonaws.com/checkhosting-20190226163640-deployment/amplify-cfn-templates/hosting/template.json',
          logicalId: 'hostingS3AndCloudFront',
        },
        lastPushTimeStamp: '2019-02-27T00:39:17.966Z',
        output: {
          S3BucketSecureURL: 'https://checkosting-20190226163802-hostingbucket-dev.s3.amazonaws.com',
          WebsiteURL: 'http://checkosting-20190226163802-hostingbucket-dev.s3-website-us-west-2.amazonaws.com',
          Region: 'us-west-2',
          HostingBucketName: 'checkosting-20190226163802-hostingbucket-dev',
        },
        lastPushDirHash: '83Bhmmec48dILMj3mi2T25B4700=',
      },
    },
  };

  const mockContext = {
    amplify: {
      pathManager: {
        getBackendDirPath: jest.fn(() => {
          return mockBackendDirPath;
        }),
      },
      getProjectConfig: jest.fn(() => {
        return mockProjectConfig;
      }),
      getProjectDetails: jest.fn(() => {
        return {
          amplifyMeta: mockAmplifyMeta,
        };
      }),
    },
    migrationInfo: {
      amplifyMeta: mockAmplifyMeta,
    },
  };

  beforeAll(() => {});

  beforeEach(() => {
    fs.existsSync.mockClear();
    fs.readdirSync.mockClear();
    fs.lstatSync.mockClear();
  });

  test('getCategoryStatus', () => {
    fs.existsSync = jest.fn(() => {
      return true;
    });
    fs.readdirSync = jest.fn(() => {
      const result = [];
      result.push(S3AndCloudFront);
      return result;
    });
    fs.lstatSync = jest.fn(() => {
      const result = {
        isDirectory: jest.fn(() => {
          return true;
        }),
      };
      return result;
    });
    const result = categoryManager.getCategoryStatus(mockContext);
    expect(result.availableServices).toBeDefined();
    expect(result.enabledServices).toBeDefined();
    expect(result.disabledServices).toBeDefined();
  });

  test('runServiceAction', async () => {
    const mockAction = 'publish';
    const mockArgs = {};
    s3AndCFIndexModule.publish = jest.fn();
    await categoryManager.runServiceAction(mockContext, S3AndCloudFront, mockAction, mockArgs);
    expect(s3AndCFIndexModule.publish).toBeCalled();
    expect(s3AndCFIndexModule.publish.mock.calls[0][0]).toBe(mockContext);
    expect(s3AndCFIndexModule.publish.mock.calls[0][1]).toBe(mockArgs);
  });

  test('migrate', async () => {
    s3AndCFIndexModule.migrate = jest.fn();
    await categoryManager.migrate(mockContext);
    expect(sequential).toBeCalled();
  });
});
