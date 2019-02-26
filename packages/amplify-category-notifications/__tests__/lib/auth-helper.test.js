jest.mock('promise-sequential');
jest.mock('amplify-category-auth');
jest.mock('mockAwsProviderModule'); 

const fs =  require('fs-extra'); 
const authCategory = require('amplify-category-auth'); 

const pinpointHelper = require('../../lib/pinpoint-helper');
const sequential = require('promise-sequential'); 
const authHelper = require('../../lib/auth-helper'); 

describe('auth-helper', () => {
    const mockPinpointClient = {
        deleteApp: jest.fn(()=>{
            return {
                promise: () => Promise.resolve()
            }; 
        })
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
        },
        "notifications": {
            "mockPinpointProjectName-dev": {
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
            }
        }
    }; 

    const mockPinpointApp = {
        Name: "mockPinpointProjectName-dev",
        Id: "mockPinpointProjectId",
        Region: "us-west-2"
    };

    const mockTeamProviderInfo = {
        "dev": {
            "awscloudformation": {
                "AuthRoleName": "mockProjectName-20190220143442-authRole",
                "UnauthRoleArn": "arn:aws:iam::mockAcountId:role/mockProjectName-20190220143442-unauthRole",
                "AuthRoleArn": "arn:aws:iam::mockAcountId:role/mockProjectName-20190220143442-authRole",
                "Region": "us-west-2",
                "DeploymentBucketName": "mockProjectName-20190220143442-deployment",
                "UnauthRoleName": "mockProjectName-20190220143442-unauthRole",
                "StackName": "mockProjectName-20190220143442",
                "StackId": "arn:aws:cloudformation:us-west-2:mockAcountId:stack/mockProjectName-20190220143442/mockStackId"
            },
            "categories": {
                "auth": {
                    "cognitoc105b1d5": {}
                },
                "notifications": {
                    "Pinpoint": {
                        "Name": "mockPinpointProjectName-dev",
                        "Id": "mockPinpointProjectId",
                        "Region": "us-west-2"
                    }
                }
            }
        }
    };

    const mockBackendConfig = {
        "auth": {
            "cognitoc105b1d5": {
                "service": "Cognito",
                "providerPlugin": "awscloudformation"
            }
        },
        "notifications": {
            "mockPinpointProjectName-dev": {
                "service": "Pinpoint",
                "channels": [
                    "Email",
                    "SMS"
                ]
            }
        }
    };

    const mockLocalEnvInfo = {
        "projectPath": "mockProjectPath",
        "defaultEditor": "none",
        "envName": "dev"
    }

    const mockBackendConfigFilePath = 'mockBackendConfigFilePath'; 
    const mockTeamProviderInfoFilepath = 'mockTeamProviderInfoFilepath';
    const mockAmplifyMetaFilePath = 'mockAmplifyMetaFilePath';
    const mockCurrentBackendConfigFilePath = 'mockCurrentBackendConfigFilePath'; 
    const mockCurrentAmplifyMetaFilePath = 'mockCurrentAmplifyMetaFilePath';

    let mockContext = {
        amplify: {
            pathManager: {
                getBackendConfigFilePath: jest.fn(()=>{
                    return mockBackendConfigFilePath; 
                }),
                getProviderInfoFilePath: jest.fn(()=>{
                    return mockTeamProviderInfoFilepath;
                }),
                getAmplifyMetaFilePath: jest.fn(()=>{
                    return mockAmplifyMetaFilePath;
                }),
                getCurrentBackendConfigFilePath: jest.fn(()=>{
                    return mockCurrentBackendConfigFilePath;
                }),
                getCurentAmplifyMetaFilePath: jest.fn(()=>{
                    return mockCurrentAmplifyMetaFilePath;
                })
            }, 
            makeId: jest.fn(()=>{return 'mockId'}),
            onCategoryOutputsChange: jest.fn(),
            getEnvDetails: jest.fn(()=>{
                return mockTeamProviderInfo; 
            }),
            getProviderPlugins: jest.fn(()=>{
                return {
                    "awscloudformation": "mockAwsProviderModule"
                };
            })
        },
        migrationInfo: {
            amplifyMeta: mockAmplifyMeta,
            localEnvInfo: mockLocalEnvInfo,
            backendConfig: mockBackendConfig,
            teamProviderInfo: mockTeamProviderInfo
        },
        exeInfo: {
            amplifyMeta: mockAmplifyMeta,
            pinpointApp: mockPinpointApp,
            teamProviderInfo: mockTeamProviderInfo, 
            localEnvInfo: mockLocalEnvInfo, 
            pinpointClient: mockPinpointClient
        },
        print: {
            info: jest.fn(),
            warning: jest.fn(),
            error: jest.fn(),
            success: jest.fn()
        }
    }; 

    beforeAll(() => {
        pinpointHelper.getPinpointClient = jest.fn(()=>{
            return Promise.resolve(mockPinpointClient); 
        }); 
        fs.existsSync = jest.fn(()=>{return true});
        fs.readFileSync = jest.fn((path)=>{
            if(path === mockBackendConfigFilePath){
                return JSON.stringify(mockBackendConfig); 
            }else if(path === mockTeamProviderInfoFilepath){
                return JSON.stringify(mockTeamProviderInfo); 
            }else if(path === mockAmplifyMetaFilePath){
                return JSON.stringify(mockAmplifyMeta); 
            }else if(path === mockCurrentBackendConfigFilePath){
                return JSON.stringify(mockBackendConfig); 
            }else if(path === mockCurrentAmplifyMetaFilePath){
                return JSON.stringify(mockAmplifyMeta); 
            }
            return undefined; 
        });
        fs.writeFileSync = jest.fn(); 
        authCategory.checkRequirements = jest.fn(()=>{
            return Promise.resolve({
                mockRequirementSatisfied: false
            })
        }); 
        authCategory.externalAuthEnable = jest.fn(()=>{}); 
    }); 

    beforeEach(() => {
        sequential.mockClear();
        mockContext.amplify.onCategoryOutputsChange.mockClear(); 
    });

    test('ensureAuth', async () => {
        await authHelper.ensureAuth(mockContext);
        expect(authCategory.externalAuthEnable).toBeCalled(); 
    });
});