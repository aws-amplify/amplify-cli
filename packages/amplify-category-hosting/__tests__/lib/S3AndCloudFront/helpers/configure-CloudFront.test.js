const fs = require('fs-extra'); 
const path = require('path'); 

jest.mock('inquirer'); 
const inquirer = require('inquirer');

const configureCloudFront = require('../../../../lib/S3AndCloudFront/helpers/configure-CloudFront'); 

describe('configure-CloudFront', ()=>{
    const configActions = {
        list: 'list', 
        add: 'add', 
        edit: 'edit', 
        remove: 'remove', 
        removeAll: 'remove all', 
        done: 'exit'
    };
    const mockContext = {
        exeInfo: {
        },
        amplify: {
            pathManager: {
                searchProjectRootPath: jest.fn(()=>{
                    return 'mockProjectRootDirPath'; 
                })
            },
            readJsonFile: (jsonFilePath)=>{
                let content = fs.readFileSync(jsonFilePath, 'utf8')
                if (content.charCodeAt(0) === 0xFEFF) {
                    content = content.slice(1);
                }
                return JSON.parse(content);
            }
        },
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        }
    }; 

    const mockDefaultRootObject = 'mockIndex.html';
    const mockDefaultCacheDefaultTTL = 111222;
    const mockDefaultCacheMaxTTL = 11122233;
    const mockDefaultCacheMinTTL = 11;

    beforeEach(()=>{
        jest.resetAllMocks();
    }); 

    test('configure: default values', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: mockDefaultRootObject,
            DefaultCacheDefaultTTL: mockDefaultCacheDefaultTTL,
            DefaultCacheMaxTTL: mockDefaultCacheMaxTTL,
            DefaultCacheMinTTL: mockDefaultCacheMinTTL,
            ConfigCustomError: false
        }); 
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

    test('configure: remove cloudfront', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: true
        }); 
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(mockContext.exeInfo.template.Resources.OriginAccessIdentity).not.toBeDefined();
        expect(mockContext.exeInfo.template.Resources.CloudFrontDistribution).not.toBeDefined();
        expect(mockContext.exeInfo.template.Resources.BucketPolicy).not.toBeDefined(); 
        expect(mockContext.exeInfo.template.Resources.PrivateBucketPolicy).not.toBeDefined();
        expect(mockContext.exeInfo.template.Outputs.CloudFrontDistributionID).not.toBeDefined();
        expect(mockContext.exeInfo.template.Outputs.CloudFrontDomainName).not.toBeDefined();
        expect(mockContext.exeInfo.template.Outputs.CloudFrontSecureURL).not.toBeDefined();
        expect(mockContext.exeInfo.template.Resources.S3Bucket.Properties.AccessControl).toBeDefined(); 
    }); 

    test('configure: add cloudfront', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate-noCloudFront.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        inquirer.prompt.mockResolvedValueOnce({
            AddCloudFront: true
        });  
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: mockDefaultRootObject,
            DefaultCacheDefaultTTL: mockDefaultCacheDefaultTTL,
            DefaultCacheMaxTTL: mockDefaultCacheMaxTTL,
            DefaultCacheMinTTL: mockDefaultCacheMinTTL,
            ConfigCustomError: false
        }); 
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

    test('configure: list', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: mockDefaultRootObject,
            DefaultCacheDefaultTTL: mockDefaultCacheDefaultTTL,
            DefaultCacheMaxTTL: mockDefaultCacheMaxTTL,
            DefaultCacheMinTTL: mockDefaultCacheMinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.list}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(mockContext.print.info).toBeCalled(); 
    });

    test('configure: add', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        const mockErrorCode = 
        {
            ErrorCode: 500
        };
        const mockCustomErrorResponses = {
            ResponseCode: 200,
            ResponsePagePath: "/",
            ErrorCachingMinTTL: 300
        };
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: mockDefaultRootObject,
            DefaultCacheDefaultTTL: mockDefaultCacheDefaultTTL,
            DefaultCacheMaxTTL: mockDefaultCacheMaxTTL,
            DefaultCacheMinTTL: mockDefaultCacheMinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.add}); 
        inquirer.prompt.mockResolvedValueOnce(mockErrorCode); 
        inquirer.prompt.mockResolvedValueOnce(mockCustomErrorResponses); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        const { DistributionConfig } = 
            mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy(); 
        expect(DistributionConfig.CustomErrorResponses).toContainEqual({
            ...mockErrorCode,
            ...mockCustomErrorResponses
        });
    });


    test('configure: edit', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        const { DistributionConfig } = 
            mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
        const mockErrorCode = {
            ErrorCode: DistributionConfig.CustomErrorResponses[0].ErrorCode
        };
        const mockCustomErrorResponses = {
            ResponseCode: 200,
            ResponsePagePath: "/mockPack",
            ErrorCachingMinTTL: 333
        };
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: mockDefaultRootObject,
            DefaultCacheDefaultTTL: mockDefaultCacheDefaultTTL,
            DefaultCacheMaxTTL: mockDefaultCacheMaxTTL,
            DefaultCacheMinTTL: mockDefaultCacheMinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.edit}); 
        inquirer.prompt.mockResolvedValueOnce(mockErrorCode); 
        inquirer.prompt.mockResolvedValueOnce(mockCustomErrorResponses); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy(); 
        expect(DistributionConfig.CustomErrorResponses).toContainEqual({
            ...mockErrorCode,
            ...mockCustomErrorResponses
        });
    });

    test('configure: remove', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        const { DistributionConfig } = 
            mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
        const mockCustomReponseToRemove = DistributionConfig.CustomErrorResponses[0]; 
        const mockErrorCode = {
            ErrorCode: mockCustomReponseToRemove.ErrorCode
        };
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: mockDefaultRootObject,
            DefaultCacheDefaultTTL: mockDefaultCacheDefaultTTL,
            DefaultCacheMaxTTL: mockDefaultCacheMaxTTL,
            DefaultCacheMinTTL: mockDefaultCacheMinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.remove}); 
        inquirer.prompt.mockResolvedValueOnce(mockErrorCode); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy(); 
        expect(DistributionConfig.CustomErrorResponses).not.toContainEqual(mockCustomReponseToRemove);
    });


    test('configure: customError remove all', async ()=>{
        const mockTemplatePath = path.join(__dirname, '../../../../__mocks__/mockTemplate.json');
        const mockTemplate = mockContext.amplify.readJsonFile(mockTemplatePath); 
        mockContext.exeInfo.template = mockTemplate; 
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: mockDefaultRootObject,
            DefaultCacheDefaultTTL: mockDefaultCacheDefaultTTL,
            DefaultCacheMaxTTL: mockDefaultCacheMaxTTL,
            DefaultCacheMinTTL: mockDefaultCacheMinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.removeAll}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        const { DistributionConfig } = 
            mockContext.exeInfo.template.Resources.CloudFrontDistribution.Properties;
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(Array.isArray(DistributionConfig.CustomErrorResponses)).toBeTruthy(); 
        expect(DistributionConfig.CustomErrorResponses).toHaveLength(0);
    });
});