const inquirer = require('inquirer');

const mockTemplate = require('../../../../__mocks__/mockTemplate');

const configureCloudFront = require('../../../../lib/S3AndCloudFront/helpers/configure-CloudFront'); 

describe('configure-CloudFront', ()=>{
    const cloudFrontDistributionSection = mockTemplate.Resources.CloudFrontDistribution; 
    const { DistributionConfig } = cloudFrontDistributionSection.Properties; 

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
            template: mockTemplate
        },
        amplify: {
            pathManager: {
                searchProjectRootPath: jest.fn(()=>{
                    return 'mockProjectRootDirPath'; 
                })
            }
        },
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        }
    }; 

    beforeAll(()=>{
        inquirer.prompt = jest.fn(); 
    }); 

    beforeEach(()=>{
        inquirer.prompt.mockClear(); 
    }); 

    test('configure: default values', async ()=>{
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: DistributionConfig.DefaultRootObject,
            DefaultCacheDefaultTTL: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
            DefaultCacheMaxTTL: DistributionConfig.DefaultCacheBehavior.MaxTTL,
            DefaultCacheMinTTL: DistributionConfig.DefaultCacheBehavior.MinTTL,
            ConfigCustomError: false
        }); 
        const result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
    }); 

    test('configure: remove cloud front then add back', async ()=>{
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: true
        }); 
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
        expect(mockContext.exeInfo.template.Resources.CloudFrontDistribution).not.toBeDefined();
        inquirer.prompt.mockResolvedValueOnce({
            AddCloudFront: true
        });  
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: DistributionConfig.DefaultRootObject,
            DefaultCacheDefaultTTL: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
            DefaultCacheMaxTTL: DistributionConfig.DefaultCacheBehavior.MaxTTL,
            DefaultCacheMinTTL: DistributionConfig.DefaultCacheBehavior.MinTTL,
            ConfigCustomError: false
        }); 
        result = await configureCloudFront.configure(mockContext); 
        expect(mockContext.exeInfo.template.Resources.CloudFrontDistribution).toBeDefined();
    }); 

    test('configure, customError list, add, edit, remove', async ()=>{
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: DistributionConfig.DefaultRootObject,
            DefaultCacheDefaultTTL: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
            DefaultCacheMaxTTL: DistributionConfig.DefaultCacheBehavior.MaxTTL,
            DefaultCacheMinTTL: DistributionConfig.DefaultCacheBehavior.MinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.list}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.add}); 
        inquirer.prompt.mockResolvedValueOnce({ErrorCode: 500}); 
        inquirer.prompt.mockResolvedValueOnce({
            ResponseCode: 200,
            ResponsePagePath: "/",
            ErrorCachingMinTTL: 300
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.edit}); 
        inquirer.prompt.mockResolvedValueOnce({ErrorCode: 400}); 
        inquirer.prompt.mockResolvedValueOnce({
            ResponseCode: 200,
            ResponsePagePath: "/",
            ErrorCachingMinTTL: 250
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        let result = await configureCloudFront.configure(mockContext); 
        expect(mockContext.print.info).toBeCalled(); 
        
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: DistributionConfig.DefaultRootObject,
            DefaultCacheDefaultTTL: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
            DefaultCacheMaxTTL: DistributionConfig.DefaultCacheBehavior.MaxTTL,
            DefaultCacheMinTTL: DistributionConfig.DefaultCacheBehavior.MinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.remove}); 
        inquirer.prompt.mockResolvedValueOnce({ErrorCode: 400}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
    }); 

    test('configure, customError remove all', async ()=>{
        inquirer.prompt.mockResolvedValueOnce({
            RemoveCloudFront: false
        }); 
        inquirer.prompt.mockResolvedValueOnce({
            DefaultRootObject: DistributionConfig.DefaultRootObject,
            DefaultCacheDefaultTTL: DistributionConfig.DefaultCacheBehavior.DefaultTTL,
            DefaultCacheMaxTTL: DistributionConfig.DefaultCacheBehavior.MaxTTL,
            DefaultCacheMinTTL: DistributionConfig.DefaultCacheBehavior.MinTTL,
            ConfigCustomError: true
        }); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.removeAll}); 
        inquirer.prompt.mockResolvedValueOnce({action: configActions.done}); 
        let result = await configureCloudFront.configure(mockContext); 
        expect(result).toEqual(mockContext); 
    });
});