jest.mock('fs-extra');
jest.mock('open');

jest.mock('../../../lib/S3AndCloudFront/configuration-manager');
jest.mock('../../../lib/S3AndCloudFront/helpers/file-uploader');
jest.mock('../../../lib/S3AndCloudFront/helpers/cloudfront-manager');

const fs = require('fs-extra');
const path = require('path');
const open = require('open');
const inquirer = require('inquirer');
const mockirer = require('mockirer');

const configManager = require('../../../lib/S3AndCloudFront/configuration-manager');
const fileUPloader = require('../../../lib/S3AndCloudFront/helpers/file-uploader');
const cloudFrontManager = require('../../../lib/S3AndCloudFront/helpers/cloudfront-manager');

const internalTemplateContents = require('../../../lib/S3AndCloudFront/template.json');
const internalParametersContents = require('../../../lib/S3AndCloudFront/parameters.json');
const mockTemplate = require('../../../__mocks__/mockTemplate');
const mockParameters = require('../../../__mocks__/mockParameters');

const serviceName = 'S3AndCloudFront';
const providerPlugin = 'awscloudformation';
const templateFileName = 'template.json';
const parametersFileName = 'parameters.json';


const DEV = 'DEV (S3 only with HTTP)';
const PROD = 'PROD (S3 with CloudFront using HTTPS)';
const Environments = [
  DEV,
  PROD,
];


const s3IndexModule = require('../../../lib/S3AndCloudFront/index');

describe('s3IndexModule', () => {
    const INTERNAL_TEMPLATE_FILE_PATH = path.normalize(path.join(__dirname, '../../../lib/', templateFileName));
    const INTERNAL_PARAMETERS_FILE_PATH = path.normalize(path.join(__dirname, '../../../lib/', parametersFileName));

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
    const mockAnswers = {
        environment: DEV
    };
    let mockContext = {
        amplify: {
            pathManager: {
                getBackendDirPath: jest.fn(()=>{
                    return 'mockBackendDirPath';
                })
            },
            updateamplifyMetaAfterResourceAdd: jest.fn(),
            getProjectMeta: jest.fn(()=>{
                return mockAmplifyMeta;
            }),
            readJsonFile: jest.fn(path => JSON.parse(fs.readFileSync(path))),
        },
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        },
        exeInfo: {
            parameters: {},
            serviceMeta: {
                output: {
                    WebsiteURL: "mockWebsiteURL"
                }
            }
        },
        parameters: {
            options: {}
        }
    };
    beforeAll(() => {
        mockirer(inquirer, mockAnswers);
        fs.ensureDirSync = jest.fn();
        fs.existsSync = jest.fn(()=>{return true;})
        fs.writeFileSync = jest.fn();
        fs.readFileSync = jest.fn((filePath)=>{
            let result;
            filePath = path.normalize(filePath);
            if(filePath.indexOf(templateFileName) > -1){
                if(filePath === INTERNAL_TEMPLATE_FILE_PATH){
                    result = JSON.stringify(internalTemplateContents);
                }else{
                    result = JSON.stringify(mockTemplate);
                }
            }else if(filePath.indexOf(parametersFileName)>-1){
                if(filePath === INTERNAL_PARAMETERS_FILE_PATH){
                    result = JSON.stringify(internalParametersContents);
                }else{
                    result = JSON.stringify(mockParameters);
                }
            }
            return result;
        });
        fileUPloader.run = jest.fn(()=>{return Promise.resolve(); });
        cloudFrontManager.invalidateCloudFront = jest.fn(()=>{return Promise.resolve(); });

    });

    beforeEach(() => {
        fs.ensureDirSync.mockClear();
        fs.writeFileSync.mockClear();
    });

    test('enable', async () => {
        await s3IndexModule.enable(mockContext);
        expect(configManager.init).toBeCalled();
        expect(mockContext.amplify.updateamplifyMetaAfterResourceAdd).toBeCalled();
    });

    test('configure', async () => {
        await s3IndexModule.configure(mockContext);
        expect(configManager.configure).toBeCalled();
    });

    test('publish', async () => {
        await s3IndexModule.publish(mockContext, {distributionDirPath: 'dist'});
        expect(fileUPloader.run).toBeCalled();
        expect(cloudFrontManager.invalidateCloudFront).toBeCalled();
        expect(open).toBeCalled();
    });

    test('console', async () => {
        await s3IndexModule.console(mockContext);
        expect(open).toBeCalled();
    });

    test('migrate', async () => {
        await s3IndexModule.migrate(mockContext);
    });
})
