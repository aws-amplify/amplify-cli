jest.mock('promise-sequential');
jest.mock('../../lib/channel-APNS');

const testChannelName = 'APNS'; 
const testChannel = require('../../lib/channel-APNS');
const sequential = require('promise-sequential'); 

const pinpointHelper = require('../../lib/pinpoint-helper');

const notificationsManager = require('../../lib/notifications-manager'); 

describe('notifications-manager', () => {
    const mockPinpointClient = {}; 
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

    let mockContext = {
        exeInfo: {
            amplifyMeta: mockAmplifyMeta,
            pinpointClient: mockPinpointClient
        }
    }; 

    beforeAll(() => {
        pinpointHelper.getPinpointClient = jest.fn(()=>{
            return Promise.resolve(mockPinpointClient); 
        })
    }); 

    beforeEach(() => {
    });

    test('getAvailableChannels', () => {
        const result = notificationsManager.getAvailableChannels();
        expect(Array.isArray(result)).toBeTruthy();
    });

    test('getEnabledChannels', () => {
        const result = notificationsManager.getEnabledChannels(mockContext);
        expect(Array.isArray(result)).toBeTruthy();
        expect(result.includes('SMS')).toBeTruthy();
        expect(result.includes('Email')).toBeTruthy();
    });

    test('getDisabledChannels', () => {
        const result = notificationsManager.getDisabledChannels(mockContext);
        expect(Array.isArray(result)).toBeTruthy();
        expect(result.includes('SMS')).toBeFalsy();
        expect(result.includes('Email')).toBeFalsy();
    });

    test('enableChannel', async () => {
        await notificationsManager.enableChannel(mockContext, testChannelName);
        expect(testChannel.enable).toBeCalled(); 
    });

    test('disableChannel', async () => {
        await notificationsManager.disableChannel(mockContext, testChannelName);
        expect(testChannel.disable).toBeCalled(); 
    });

    test('configureChannel', async () => {
        await notificationsManager.configureChannel(mockContext, testChannelName);
        expect(testChannel.configure).toBeCalled(); 
    });

    test('pullAllChannels', async () => {
        await notificationsManager.pullAllChannels(mockContext, testChannelName);
        expect(sequential).toBeCalled(); 
    });

});