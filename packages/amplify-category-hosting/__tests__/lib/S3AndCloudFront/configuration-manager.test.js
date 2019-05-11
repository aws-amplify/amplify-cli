jest.mock('inquirer');
const inquirer = require('inquirer');

jest.mock('../../../lib/S3AndCloudFront/helpers/configure-Website');
const configureWebsite = require('../../../lib/S3AndCloudFront/helpers/configure-Website'); 
jest.mock('../../../lib/S3AndCloudFront/helpers/configure-CloudFront');
const configureCloudFront = require('../../../lib/S3AndCloudFront/helpers/configure-CloudFront'); 
jest.mock('../../../lib/S3AndCloudFront/helpers/configure-Publish');
const configurePublish = require('../../../lib/S3AndCloudFront/helpers/configure-Publish'); 

const configurationManager = require('../../../lib/S3AndCloudFront/configuration-manager'); 

describe('configuration-manager', () => {
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
                    "HostingBucketName": "checkosting-20190226163802-hostingbucket-dev"
                },
                "lastPushDirHash": "83Bhmmec48dILMj3mi2T25B4700="
            }
        }
    }

    const mockProjectConfig = {
        "projectName": "mockProjectName",
        "version": "2.0",
        "frontend": "javascript",
        "javascript": {
            "framework": "none",
            "config": {
                "SourceDir": "src",
                "DistributionDir": "dist",
                "BuildCommand": "npm run-script build",
                "StartCommand": "npm run-script start"
            }
        },
        "providers": [
            "awscloudformation"
        ]
    };

    const mockContext = {
        exeInfo: {
            parameters: {},
            projectConfig: mockProjectConfig,
            serviceMeta: mockAmplifyMeta.hosting.S3AndCloudFront
        }
    }; 

    beforeEach(() => {
        jest.resetAllMocks(); 
    });

    test('init', async () => {
        inquirer.prompt.mockResolvedValueOnce({HostingBucketName: 'mockHostingBucketName'}); 
        await configurationManager.init(mockContext); 
        expect(mockContext.exeInfo.parameters.bucketName).toBeDefined(); 
        expect(configureWebsite.configure).toBeCalledWith(mockContext); 
    });

    test('configure', async () => {
        inquirer.prompt.mockResolvedValueOnce({section: 'Website'}); 
        inquirer.prompt.mockResolvedValueOnce({section: 'CloudFront'}); 
        inquirer.prompt.mockResolvedValueOnce({section: 'Publish'}); 
        inquirer.prompt.mockResolvedValueOnce({section: 'exit'}); 
        await configurationManager.configure(mockContext); 
        expect(configureWebsite.configure).toBeCalledWith(mockContext); 
        expect(configureCloudFront.configure).toBeCalledWith(mockContext); 
        expect(configurePublish.configure).toBeCalledWith(mockContext); 
    });
})