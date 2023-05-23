const fs = require('fs-extra');
const path = require('path');
const configureCloudFront = require('../../../../lib/S3AndCloudFront/helpers/configure-CloudFront');
const amplifyPrompts = require('@aws-amplify/amplify-prompts');

jest.mock('@aws-amplify/amplify-prompts', () => ({
  prompter: {
    input: jest.fn(),
    yesOrNo: jest.fn(),
    pick: jest.fn(),
  },
  byValue: jest.fn(),
}));

describe('configure-CloudFront', () => {
  const configActions = {
    list: 'list',
    add: 'add',
    edit: 'edit',
    remove: 'remove',
    removeAll: 'remove all',
    done: 'exit',
  };
  const mockContext = {
    exeInfo: {},
    amplify: {
      pathManager: {
        searchProjectRootPath: jest.fn(() => {
          return 'mockProjectRootDirPath';
        }),
      },
      readJsonFile: (jsonFilePath) => {
        let content = fs.readFileSync(jsonFilePath, 'utf8');
        if (content.charCodeAt(0) === 0xfeff) {
          content = content.slice(1);
        }
        return JSON.parse(content);
      },
    },
    print: {
      info: jest.fn(),
      warning: jest.fn(),
      error: jest.fn(),
      success: jest.fn(),
    },
  };

  const mockDefaultRootObject = 'mockIndex.html';
  const mockDefaultCacheDefaultTTL = 111222;
  const mockDefaultCacheMaxTTL = 11122233;
  const mockDefaultCacheMinTTL = 11;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('configure: default values', async () => {
    const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
    const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath);
    mockContext.exeInfo.template = mockTemplate;
    amplifyPrompts.prompter.yesOrNo
      .mockResolvedValueOnce(false) // Remove CloudFront from hosting
      .mockResolvedValueOnce(false); // Configure Custom Error Responses

    amplifyPrompts.prompter.input
      .mockResolvedValueOnce(mockDefaultRootObject)
      .mockResolvedValueOnce(mockDefaultCacheDefaultTTL)
      .mockResolvedValueOnce(mockDefaultCacheMaxTTL)
      .mockResolvedValueOnce(mockDefaultCacheMinTTL);

    const result = await configureCloudFront.configure(mockContext);
    const { DistributionConfig } = mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
    expect(result).toEqual(mockContext);
    expect(mockContext.exeInfo.template.Resources.OriginAccessIdentity).toBeDefined();
    expect(mockContext.exeInfo.template.Resources.CloudFrontDistribution).toBeDefined();
    expect(mockContext.exeInfo.template.Resources.BucketPolicy).not.toBeDefined();
    expect(mockContext.exeInfo.template.Resources.PrivateBucketPolicy).toBeDefined();
    expect(mockContext.exeInfo.template.Outputs.CloudFrontDistributionID).toBeDefined();
    expect(mockContext.exeInfo.template.Outputs.CloudFrontDomainName).toBeDefined();
    expect(mockContext.exeInfo.template.Outputs.CloudFrontSecureURL).toBeDefined();
    expect(mockContext.exeInfo.template.Resources.S3Bucket.Properties.AccessControl).not.toBeDefined();
    expect(DistributionConfig.DefaultRootObject).toEqual(mockDefaultRootObject);
    expect(DistributionConfig.DefaultCacheBehavior.DefaultTTL).toEqual(mockDefaultCacheDefaultTTL);
    expect(DistributionConfig.DefaultCacheBehavior.MaxTTL).toEqual(mockDefaultCacheMaxTTL);
    expect(DistributionConfig.DefaultCacheBehavior.MinTTL).toEqual(mockDefaultCacheMinTTL);
  });

  test('configure: add cloudfront', async () => {
    const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate-noCloudFront.json');
    const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath);
    mockContext.exeInfo.template = mockTemplate;
    amplifyPrompts.prompter.yesOrNo = jest
      .fn()
      .mockResolvedValueOnce(true) // Add CloudFront to hosting
      .mockResolvedValueOnce(false); // Configure Custom Error Responses

    amplifyPrompts.prompter.input = jest
      .fn()
      .mockResolvedValueOnce(mockDefaultRootObject)
      .mockResolvedValueOnce(mockDefaultCacheDefaultTTL)
      .mockResolvedValueOnce(mockDefaultCacheMaxTTL)
      .mockResolvedValueOnce(mockDefaultCacheMinTTL);

    result = await configureCloudFront.configure(mockContext);
    const { DistributionConfig } = mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
    expect(result).toEqual(mockContext);
    expect(mockContext.exeInfo.template.Resources.OriginAccessIdentity).toBeDefined();
    expect(mockContext.exeInfo.template.Resources.CloudFrontDistribution).toBeDefined();
    expect(mockContext.exeInfo.template.Resources.PrivateBucketPolicy).toBeDefined();
    expect(mockContext.exeInfo.template.Outputs.CloudFrontDistributionID).toBeDefined();
    expect(mockContext.exeInfo.template.Outputs.CloudFrontDomainName).toBeDefined();
    expect(mockContext.exeInfo.template.Outputs.CloudFrontSecureURL).toBeDefined();
    expect(mockContext.exeInfo.template.Resources.BucketPolicy).not.toBeDefined();
    expect(mockContext.exeInfo.template.Resources.S3Bucket.Properties.AccessControl).not.toBeDefined();
    expect(DistributionConfig.DefaultRootObject).toEqual(mockDefaultRootObject);
    expect(DistributionConfig.DefaultCacheBehavior.DefaultTTL).toEqual(mockDefaultCacheDefaultTTL);
    expect(DistributionConfig.DefaultCacheBehavior.MaxTTL).toEqual(mockDefaultCacheMaxTTL);
    expect(DistributionConfig.DefaultCacheBehavior.MinTTL).toEqual(mockDefaultCacheMinTTL);
  });

  test('configure: list', async () => {
    const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
    const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath);
    mockContext.exeInfo.template = mockTemplate;
    amplifyPrompts.byValue = jest.fn().mockReturnValue('list');
    amplifyPrompts.prompter.yesOrNo = jest.fn().mockResolvedValueOnce(true); // Configure Custom Error Responses

    amplifyPrompts.prompter.input = jest
      .fn()
      .mockResolvedValueOnce(mockDefaultRootObject)
      .mockResolvedValueOnce(mockDefaultCacheDefaultTTL)
      .mockResolvedValueOnce(mockDefaultCacheMaxTTL)
      .mockResolvedValueOnce(mockDefaultCacheMinTTL);

    amplifyPrompts.prompter.pick = jest.fn().mockResolvedValueOnce(configActions.list).mockResolvedValueOnce(configActions.done);

    let result = await configureCloudFront.configure(mockContext);
    expect(result).toEqual(mockContext);
    expect(mockContext.print.info).toBeCalled();
  });

  test('configure: add', async () => {
    const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
    const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath);
    mockContext.exeInfo.template = mockTemplate;
    const mockErrorCode = {
      ErrorCode: 500,
    };
    const mockCustomErrorResponses = {
      ResponseCode: 200,
      ResponsePagePath: '/',
      ErrorCachingMinTTL: 300,
    };
    amplifyPrompts.byValue = jest.fn().mockReturnValue('list');
    amplifyPrompts.prompter.yesOrNo = jest.fn().mockResolvedValueOnce(true); // Configure Custom Error Responses

    amplifyPrompts.prompter.input = jest
      .fn()
      .mockResolvedValueOnce(mockDefaultRootObject)
      .mockResolvedValueOnce(mockDefaultCacheDefaultTTL)
      .mockResolvedValueOnce(mockDefaultCacheMaxTTL)
      .mockResolvedValueOnce(mockDefaultCacheMinTTL)
      .mockResolvedValueOnce(mockCustomErrorResponses.ResponseCode)
      .mockResolvedValueOnce(mockCustomErrorResponses.ResponsePagePath)
      .mockResolvedValueOnce(mockCustomErrorResponses.ErrorCachingMinTTL);

    amplifyPrompts.prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(configActions.add)
      .mockResolvedValueOnce(mockErrorCode.ErrorCode)
      .mockResolvedValueOnce(configActions.done);

    const { DistributionConfig } = mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
    let result = await configureCloudFront.configure(mockContext);
    expect(result).toEqual(mockContext);
    expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy();
    expect(DistributionConfig.CustomErrorResponses).toContainEqual({
      ...mockErrorCode,
      ...mockCustomErrorResponses,
    });
  });

  test('configure: edit', async () => {
    const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
    const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath);
    mockContext.exeInfo.template = mockTemplate;
    const { DistributionConfig } = mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
    const mockErrorCode = {
      ErrorCode: DistributionConfig.CustomErrorResponses[0].ErrorCode,
    };
    const mockCustomErrorResponses = {
      ResponseCode: 200,
      ResponsePagePath: '/mockPack',
      ErrorCachingMinTTL: 333,
    };

    amplifyPrompts.byValue = jest.fn().mockReturnValue('list');
    amplifyPrompts.prompter.yesOrNo = jest.fn().mockResolvedValueOnce(true); // Configure Custom Error Responses

    amplifyPrompts.prompter.input = jest
      .fn()
      .mockResolvedValueOnce(mockDefaultRootObject)
      .mockResolvedValueOnce(mockDefaultCacheDefaultTTL)
      .mockResolvedValueOnce(mockDefaultCacheMaxTTL)
      .mockResolvedValueOnce(mockDefaultCacheMinTTL)
      .mockResolvedValueOnce(mockCustomErrorResponses.ResponseCode)
      .mockResolvedValueOnce(mockCustomErrorResponses.ResponsePagePath)
      .mockResolvedValueOnce(mockCustomErrorResponses.ErrorCachingMinTTL);

    amplifyPrompts.prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(configActions.edit)
      .mockResolvedValueOnce(mockErrorCode.ErrorCode)
      .mockResolvedValueOnce(configActions.done);

    let result = await configureCloudFront.configure(mockContext);
    expect(result).toEqual(mockContext);
    expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy();
    expect(DistributionConfig.CustomErrorResponses).toContainEqual({
      ...mockErrorCode,
      ...mockCustomErrorResponses,
    });
  });

  test('configure: remove', async () => {
    const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
    const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath);
    mockContext.exeInfo.template = mockTemplate;
    const { DistributionConfig } = mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
    const mockCustomResponseToRemove = DistributionConfig.CustomErrorResponses[0];
    const mockErrorCode = {
      ErrorCode: mockCustomResponseToRemove.ErrorCode,
    };

    amplifyPrompts.byValue = jest.fn().mockReturnValue('list');
    amplifyPrompts.prompter.yesOrNo = jest.fn().mockResolvedValueOnce(true); // Configure Custom Error Responses

    amplifyPrompts.prompter.input = jest
      .fn()
      .mockResolvedValueOnce(mockDefaultRootObject)
      .mockResolvedValueOnce(mockDefaultCacheDefaultTTL)
      .mockResolvedValueOnce(mockDefaultCacheMaxTTL)
      .mockResolvedValueOnce(mockDefaultCacheMinTTL);

    amplifyPrompts.prompter.pick = jest
      .fn()
      .mockResolvedValueOnce(configActions.remove)
      .mockResolvedValueOnce(mockErrorCode.ErrorCode)
      .mockResolvedValueOnce(configActions.done);

    let result = await configureCloudFront.configure(mockContext);
    expect(result).toEqual(mockContext);
    expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy();
    expect(DistributionConfig.CustomErrorResponses).not.toContainEqual(mockCustomResponseToRemove);
  });

  test('configure: customError remove all', async () => {
    const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
    const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath);
    mockContext.exeInfo.template = mockTemplate;

    amplifyPrompts.prompter.yesOrNo = jest.fn().mockResolvedValueOnce(true); // Configure Custom Error Responses

    amplifyPrompts.prompter.input = jest
      .fn()
      .mockResolvedValueOnce(mockDefaultRootObject)
      .mockResolvedValueOnce(mockDefaultCacheDefaultTTL)
      .mockResolvedValueOnce(mockDefaultCacheMaxTTL)
      .mockResolvedValueOnce(mockDefaultCacheMinTTL);

    amplifyPrompts.prompter.pick = jest.fn().mockResolvedValueOnce(configActions.removeAll).mockResolvedValueOnce(configActions.done);

    const { DistributionConfig } = mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
    let result = await configureCloudFront.configure(mockContext);
    expect(result).toEqual(mockContext);
    expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy();
    expect(DistributionConfig.CustomErrorResponses).toHaveLength(0);
  });
});
