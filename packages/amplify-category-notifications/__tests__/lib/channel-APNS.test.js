const inquirer = require('inquirer');
const mockirer = require('mockirer');
const fs = require('fs-extra'); 
const configureKey = require('../../lib/apns-key-config');
const configureCertificate = require('../../lib/apns-cert-config');

const channelName = 'APNS';

const channelAPNS = require('../../lib/channel-APNS'); 

describe('channel-APNS', () => {
    const mockServiceOutput = {
        Id: 'mockAppId'
    }; 
    const mockChannelOutput = { Enabled: true};

    const mockPinpointResponseErr = {
        code: 'errorCode'
    }; 

    const mockChannelResponse = {}; 
    const mockPinpointResponseData = {
        APNSChannelResponse: mockChannelResponse
    }; 

    const mockKeyConfig = {}; 
    const mockCertificateConfig = {}; 
    const mockPinpointClient = {
    }
    mockServiceOutput[channelName] = mockChannelOutput;
    
    let mockContext = {
        exeInfo: {
            serviceMeta: {
                output: mockServiceOutput
            },
            pinpointClient: mockPinpointClient
        },
        print: {
            info: jest.fn(),
            error: jest.fn()
        }
    }; 

    let mockPinpointApp = {
        Id: 'mockPinpoingAppId'
    }

    beforeAll(() => {
        global.console = {log: jest.fn()};
        fs.existsSync = jest.fn(()=>{
            return true; 
        })
        configureKey.run = jest.fn(()=>{
            return Promise.resolve(mockKeyConfig); 
        });
        configureCertificate.run = jest.fn(()=>{
            return Promise.resolve(mockCertificateConfig); 
        }); 
    }); 

    beforeEach(() => { 
        mockContext.exeInfo.pinpointInputParams = {}; 
    });

    test('configure enabled to disabled', () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: true}); 
        
        return channelAPNS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    });

    test('configure enabled no change', () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: false}); 
        
        return channelAPNS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    });

    test('configure disabled to enabled', () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: true}); 
        
        return channelAPNS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    });

    test('configure disabled no change', () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: false}); 
        
        return channelAPNS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateApnsChannel).not.toBeCalled();
        });
    });

    test('enable Certificate success', async () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockirer(inquirer, {DefaultAuthenticationMethod: 'Certificate'}); 
        
        return channelAPNS.enable(mockContext, 'successMessage').then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    });

    test('enable Key success', async () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockirer(inquirer, {DefaultAuthenticationMethod: 'Key'}); 
        
        return channelAPNS.enable(mockContext, 'successMessage').then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    });

    test('enable Certificate fail', async () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });

        mockirer(inquirer, {DefaultAuthenticationMethod: 'Certificate'}); 
        
        return channelAPNS.enable(mockContext, 'successMessage').catch((err)=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        })
    });

    test('enable with inputParams Certificate success', async () => {
        mockContext.exeInfo.pinpointInputParams[channelName] = {
            DefaultAuthenticationMethod: 'Certificate',
            P12FilePath: 'mockPath'
        }
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        return channelAPNS.enable(mockContext, 'successMessage').then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    });

    test('enable with inputParams Key success', async () => {
        mockContext.exeInfo.pinpointInputParams[channelName] = {
            DefaultAuthenticationMethod: 'Key',
            BundleId: 'mockBundleId',
            TeamId: 'mockTeamId',
            TokenKeyId: 'mockTokenKeyId',
            P8FilePath: 'mockPath'
        }
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        return channelAPNS.enable(mockContext, 'successMessage').then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    });

    test('disable success', () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });
        
        return channelAPNS.disable(mockContext).then(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        });
    }); 

    test('disable fail', () => {
        mockPinpointClient.updateApnsChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });
        
        return channelAPNS.disable(mockContext).catch(()=>{
            expect(mockPinpointClient.updateApnsChannel).toBeCalled();
        })
    });

    test('pull success', () => {
        mockPinpointClient.getApnsChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.resolve(mockPinpointResponseData)
            }; 
        });
        
        return channelAPNS.pull(mockContext, mockPinpointApp).then((r)=>{
            expect(mockPinpointClient.getApnsChannel).toBeCalled();
            expect(r).toEqual(mockChannelResponse); 
        });
    }); 

    test('pull not found', () => {
        mockPinpointResponseErr.code = 'NotFoundException'; 
        mockPinpointClient.getApnsChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelAPNS.pull(mockContext, mockPinpointApp).then((e)=>{
            expect(mockPinpointClient.getApnsChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 

    test('pull other error', () => {
        mockPinpointResponseErr.code = 'otherCode'; 
        mockPinpointClient.getApnsChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelAPNS.pull(mockContext, mockPinpointApp).catch((e)=>{
            expect(mockPinpointClient.getApnsChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 
});