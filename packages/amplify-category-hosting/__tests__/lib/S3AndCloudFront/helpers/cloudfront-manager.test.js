const mockAwsProviderModule = require('../../../../__mocks__/mockAwsProviderModule');

const cloudFrontManager = require('../../../../lib/S3AndCloudFront/helpers/cloudfront-manager'); 

describe('cloudfront-manager', () => {
    const mockAmplifyMeta = {
        "providers": {
            "awscloudformation": {
                "AuthRoleName": "checkhosting-20190226163640-authRole",
                "UnauthRoleArn": "arn:aws:iam::mockAccountId:role/checkhosting-20190226163640-unauthRole",
                "AuthRoleArn": "arn:aws:iam::mockAccountId:role/checkhosting-20190226163640-authRole",
                "Region": "us-west-2",
                "DeploymentBucketName": "checkhosting-20190226163640-deployment",
                "UnauthRoleName": "checkhosting-20190226163640-unauthRole",
                "StackName": "checkhosting-20190226163640",
                "StackId": "arn:aws:cloudformation:us-west-2:mockAccountId:stack/checkhosting-20190226163640/2c061610-3a28-11e9-acf3-02ee71065ed8"
            }
        },
        "hosting": {
            "S3AndCloudFront": {
                "service": "S3AndCloudFront",
                "providerPlugin": "awscloudformation",
                "providerMetadata": {
                    "s3TemplateURL": "https://s3.amazonaws.com/checkhosting-20190226163640-deployment/amplify-cfn-templates/hosting/template.json",
                    "logicalId": "hostingS3AndCloudFront"
                },
                "lastPushTimeStamp": "2019-02-27T00:39:17.966Z",
                "output": {
                    "S3BucketSecureURL": "https://checkosting-20190226163802-hostingbucket-dev.s3.amazonaws.com",
                    "WebsiteURL": "http://checkosting-20190226163802-hostingbucket-dev.s3-website-us-west-2.amazonaws.com",
                    "Region": "us-west-2",
                    "HostingBucketName": "checkosting-20190226163802-hostingbucket-dev", 
                    "CloudFrontDistributionID": "mockCloudFrontDistributionID",
                    "CloudFrontSecureURL": "mockCloudFrontSecureURL"

                },
                "lastPushDirHash": "83Bhmmec48dILMj3mi2T25B4700="
            }
        }
    }

    const mockContext = {
        amplify: {
            getProviderPlugins: jest.fn(()=>{
                return {
                    "awscloudformation": "mockAwsProviderModule"
                };
            })
        },
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        },
        parameters: {
            options: {
                invalidateCache: true
            }
        },
        exeInfo: {
            serviceMeta: mockAmplifyMeta.hosting.S3AndCloudFront
        }
    }; 

    const mockcftInvalidationData = {}; 

    const mockInvalidateMethod = jest.fn(()=>{
        return {
            promise: () => Promise.resolve(mockcftInvalidationData),
        };
    }); 
    
    class mockCloudFront {
        constructor(){
            this.createInvalidation = mockInvalidateMethod; 
        }
    }

    mockAwsProviderModule.getConfiguredAWSClient = ()=>{
        return {
            CloudFront: mockCloudFront
        };
    }

    test('invalidateCloudFront', async () => {
        const result = await cloudFrontManager.invalidateCloudFront(mockContext); 
        expect(result).toBe(mockContext); 
        expect(mockInvalidateMethod).toBeCalled(); 
        expect(mockContext.exeInfo.cftInvalidationData).toEqual(mockcftInvalidationData); 
    });
})