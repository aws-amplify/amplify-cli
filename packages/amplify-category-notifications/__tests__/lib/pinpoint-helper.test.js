jest.mock('opn');

const inquirer = require('inquirer');
const mockirer = require('mockirer');
const opn = require('opn');

const authHelper = require('../../lib/auth-helper');
const constants = require('../../lib/constants');
const pinpointHelper = require('../../lib/pinpoint-helper'); 

describe('pinpoint-helper', () => {
    const mockPinpointClient = {}; 
    const mockNotificationsServiceMeta = {
        "service": "Pinpoint",
        "output": {
            "Name": "mockPinpointProjectName-dev",
            "Id": "mockPinpointProjectId",
            "Region": "us-west-2",
            "SMS": {
                "ApplicationId": "mockPinpointProjectId",
                "CreationDate": "2019-02-20T23:42:01.675Z",
                "Enabled": true,
                "Id": "sms",
                "IsArchived": false,
                "LastModifiedDate": "2019-02-20T23:42:01.675Z",
                "Platform": "SMS",
                "PromotionalMessagesPerSecond": 20,
                "TransactionalMessagesPerSecond": 20,
                "Version": 1
            },
            "Email": {
                "ApplicationId": "mockPinpointProjectId",
                "CreationDate": "2019-02-20T23:45:18.506Z",
                "Enabled": true,
                "FromAddress": "mockEmailId@amazon.com",
                "Id": "email",
                "Identity": "arn:aws:ses:us-west-2:mockAcountId:identity/mockEmailId@amazon.com",
                "IsArchived": false,
                "LastModifiedDate": "2019-02-20T23:45:18.506Z",
                "MessagesPerSecond": 1,
                "Platform": "EMAIL",
                "RoleArn": "  ",
                "Version": 1
            }
        },
        "lastPushTimeStamp": "2019-02-20T23:39:28.890Z"
    }; 
    const mockNotificationsMeta = {
        "mockPinpointServiceName-dev": mockNotificationsServiceMeta
    }; 
    const mockAnalyticsSerivceMeta = {
        "service": "Pinpoint",
        "providerPlugin": "awscloudformation",
        "providerMetadata": {
            "s3TemplateURL": "mockS3TemplateURL",
            "logicalId": "analyticsmockAnalyticsServiceName"
        },
        "output": {
            "appName": "mockPinpointProjectName-dev",
            "Id": "mockPinpointProjectId",
            "Region": "us-west-2"
        },
        "lastPushTimeStamp": "2019-02-20T23:39:28.890Z"
    }; 
    const mockAnalyticsMeta = {
        "mockAnalyticsServiceName": mockAnalyticsSerivceMeta
    }; 
    const mockAmplifyMeta = {
        "providers": {
            "awscloudformation": {
                "AuthRoleName": "mockProjectName-20190220143442-authRole",
                "UnauthRoleArn": "arn:aws:iam::mockAcountId:role/mockProjectName-20190220143442-unauthRole",
                "AuthRoleArn": "arn:aws:iam::mockAcountId:role/mockProjectName-20190220143442-authRole",
                "Region": "us-west-2",
                "DeploymentBucketName": "mockProjectName-20190220143442-deployment",
                "UnauthRoleName": "mockProjectName-20190220143442-unauthRole",
                "StackName": "mockProjectName-20190220143442",
                "StackId": "arn:aws:cloudformation:us-west-2:mockAcountId:stack/mockProjectName-20190220143442/mockStackId"
            }
        }
    }; 

    const mockLocalEnvInfo = {
        "projectPath": "mockProjectPath",
        "defaultEditor": "none",
        "envName": "dev"
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
    }

    const mockContext = {
        amplify: {
            makeId: jest.fn(()=>{return 'mockId'}),
            getProviderPlugins: jest.fn(()=>{
                return {
                    "awscloudformation": "mockAwsProviderModule"
                };
            })
        },
        exeInfo: {
            amplifyMeta: mockAmplifyMeta,
            localEnvInfo: mockLocalEnvInfo,
            projectConfig: mockProjectConfig,
            pinpointClient: mockPinpointClient,
        },
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        }
    }; 

    

    const mockInquirerAnswers = {
        projectName: 'mockPinpointProjectName'
    }


    beforeAll(() => {
        mockirer(inquirer, mockInquirerAnswers); 
        authHelper.ensureAuth = jest.fn(); 
    }); 

    beforeEach(() => {
        mockNotificationsMeta["mockPinpointProjectName-dev"] = mockNotificationsServiceMeta; 
        mockAnalyticsMeta["mockAnalyticsServiceName"] = mockAnalyticsSerivceMeta; 
        delete mockContext.exeInfo.pinpointApp;
        delete mockContext.exeInfo.serviceMeta;
        delete mockAmplifyMeta[constants.CategoryName]; 
        delete mockAmplifyMeta[constants.AnalyticsCategoryName]; 
        authHelper.ensureAuth.mockClear(); 
    });

    test('getPinpointApp', () => {
        const result = pinpointHelper.getPinpointApp(mockContext);
        expect(result).not.toBeDefined();
    });

    test('ensurePinpointApp, notifications already exists', async () => {
        mockAmplifyMeta[constants.CategoryName] = mockNotificationsMeta;
        await pinpointHelper.ensurePinpointApp(mockContext);
        expect(mockContext.exeInfo.pinpointApp).toBeDefined();
        expect(mockContext.exeInfo.serviceMeta).toBeDefined();
    });

    test('ensurePinpointApp, analytics already exists', async () => {
        mockAmplifyMeta[constants.AnalyticsCategoryName] = mockAnalyticsMeta;
        await pinpointHelper.ensurePinpointApp(mockContext);
        expect(mockContext.exeInfo.pinpointApp).toBeDefined();
        expect(mockContext.exeInfo.serviceMeta).toBeDefined();
    });

    test('ensurePinpointApp, create new', async () => {
        await pinpointHelper.ensurePinpointApp(mockContext);
        expect(mockContext.exeInfo.pinpointApp).toBeDefined();
        expect(mockContext.exeInfo.serviceMeta).toBeDefined();

    });

    test('deletePinpointApp', async () => {
        mockAmplifyMeta[constants.CategoryName] = mockNotificationsMeta;
        mockAmplifyMeta[constants.AnalyticsCategoryName] = mockAnalyticsMeta;
        await pinpointHelper.deletePinpointApp(mockContext);
        expect(mockNotificationsMeta.mockPinpointServiceName).not.toBeDefined(); 
        expect(mockAnalyticsMeta.mockAnalyticsServiceName).not.toBeDefined(); 
    });

    test('scanCategoryMetaForPinpoint', async () => {
        const result = await pinpointHelper.scanCategoryMetaForPinpoint(mockNotificationsMeta);
        expect(result).toBeDefined(); 
    });

    test('getPinpointClient', async () => {
        const result = await pinpointHelper.getPinpointClient(mockContext);
        expect(result).toBeDefined(); 
    });

    test('isAnalyticsAdded', async () => {
        mockAmplifyMeta[constants.AnalyticsCategoryName] = mockAnalyticsMeta;
        const result = pinpointHelper.isAnalyticsAdded(mockContext);
        expect(result).toBeTruthy(); 
    });

    test('console', async () => {
        mockAmplifyMeta[constants.CategoryName] = mockNotificationsMeta;
        await pinpointHelper.console(mockContext);
        expect(opn).toBeCalled(); 
    });

});