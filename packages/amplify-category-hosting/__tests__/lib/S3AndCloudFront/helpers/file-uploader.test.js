jest.mock('mime-types');
jest.mock('../../../../lib/S3AndCloudFront/helpers/file-scanner', ()=>{
    return {
        scan: jest.fn(()=>{
            return [
                'filePath1',
                'filePath2'
            ]
        })
    }
});

const fs = require('fs-extra');
const mime = require('mime-types');

const fileScanner = require('../../../../lib/S3AndCloudFront/helpers/file-scanner');

const mockTemplate = require('../../../../__mocks__/mockTemplate');
const mockParameters = require('../../../../__mocks__/mockParameters');

const fileUploader = require('../../../../lib/S3AndCloudFront/helpers/file-uploader'); 

describe('cloudfront-manager', () => {
    const mockAmplifyMeta = {
        "providers": {
            "awscloudformation": {
                "AuthRoleName": "checkhosting-20190228131446-authRole",
                "UnauthRoleArn": "arn:aws:iam::mockAccountId:role/checkhosting-20190228131446-unauthRole",
                "AuthRoleArn": "arn:aws:iam::mockAccountId:role/checkhosting-20190228131446-authRole",
                "Region": "us-west-2",
                "DeploymentBucketName": "checkhosting-20190228131446-deployment",
                "UnauthRoleName": "checkhosting-20190228131446-unauthRole",
                "StackName": "checkhosting-20190228131446",
                "StackId": "arn:aws:cloudformation:us-west-2:mockAccountId:stack/checkhosting-20190228131446/52623470-3b9e-11e9-a03a-0ad6ed005066"
            }
        },
        "hosting": {
            "S3AndCloudFront": {
                "service": "S3AndCloudFront",
                "providerPlugin": "awscloudformation",
                "providerMetadata": {
                    "s3TemplateURL": "https://s3.amazonaws.com/checkhosting-20190228131446-deployment/amplify-cfn-templates/hosting/template.json",
                    "logicalId": "hostingS3AndCloudFront"
                },
                "lastPushTimeStamp": "2019-02-28T22:35:50.043Z",
                "output": {
                    "S3BucketSecureURL": "https://checkhosting-20190228131606-hostingbucket-dev.s3.amazonaws.com",
                    "WebsiteURL": "http://checkhosting-20190228131606-hostingbucket-dev.s3-website-us-west-2.amazonaws.com",
                    "Region": "us-west-2",
                    "HostingBucketName": "checkhosting-20190228131606-hostingbucket-dev",
                    "CloudFrontSecureURL": "https://mockdomain.cloudfront.net",
                    "CloudFrontDistributionID": "MOCKDISID01V",
                    "CloudFrontDomainName": "mockdomain.cloudfront.net"
                },
                "lastPushDirHash": "MockHashehogmJPW8UwL5Q1JZlI="
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
            template: mockTemplate,
            parameters: mockParameters,
            amplifyMeta: mockAmplifyMeta,
        }
    }; 

    beforeAll(() => {
        fs.createReadStream = jest.fn(()=>{
            return {};
        });
        mime.lookup = jest.fn(()=>{ 
            return 'text/plain';
        });
    }); 

    beforeEach(() => {
    });

    test('run', async () => {
        await fileUploader.run(mockContext, 'mockDistributionFolder'); 
        expect(fileScanner.scan).toBeCalled(); 
    });
})