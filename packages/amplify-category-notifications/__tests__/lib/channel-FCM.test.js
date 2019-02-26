const inquirer = require('inquirer');
const mockirer = require('mockirer');

const channelName = 'FCM';

const channelFCM = require('../../lib/channel-FCM'); 

describe('channel-FCM', () => {
    const mockServiceOutput = {
        Id: 'mockAppId'
    }; 
    const mockChannelOutput = { Enabled: true};

    const mockPinpointResponseErr = {
        code: 'errorCode'
    }; 

    const mockChannelResponse = {}; 
    const mockPinpointResponseData = {
        GCMChannelResponse: mockChannelResponse
    }; 

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
    }); 

    beforeEach(() => { 
        mockContext.exeInfo.pinpointInputParams = {}; 
    });

    test('configure enabled to disabled', () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: true}); 
        
        return channelFCM.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
        });
    });

    test('configure enabled no change', () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: false}); 
        
        return channelFCM.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
        });
    });

    test('configure disabled to enabled', () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: true}); 
        
        return channelFCM.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
        });
    });

    test('configure disabled no change', () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: false}); 
        
        return channelFCM.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateGcmChannel).not.toBeCalled();
        });
    });

    test('enable success', async () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockirer(inquirer, 
            {
                ApiKey: 'MockApiKey'
            }
        ); 
        
        return channelFCM.enable(mockContext, 'successMessage').then((data)=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    });

    test('enable failed', async () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });

        mockirer(inquirer, 
            {
                ApiKey: 'MockApiKey'
            }
        ); 
        
        return channelFCM.enable(mockContext, 'successMessage').catch((err)=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
            expect(err).toEqual(mockPinpointResponseErr);
        });
    });

    test('enable with inputParams success', async () => {
        mockContext.exeInfo.pinpointInputParams[channelName] = {
            ApiKey: 'MockApiKey'
        }
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });
        
        return channelFCM.enable(mockContext, 'successMessage').then((data)=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    });

    test('disable success', () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });
        
        return channelFCM.disable(mockContext).then((data)=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    }); 

    test('disable fail', () => {
        mockPinpointClient.updateGcmChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });
        
        return channelFCM.disable(mockContext).catch((err)=>{
            expect(mockPinpointClient.updateGcmChannel).toBeCalled();
            expect(err).toEqual(mockPinpointResponseErr);
        })
    });

    test('pull success', () => {
        mockPinpointClient.getGcmChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.resolve(mockPinpointResponseData)
            }; 
        });
        
        return channelFCM.pull(mockContext, mockPinpointApp).then((r)=>{
            expect(mockPinpointClient.getGcmChannel).toBeCalled();
            expect(r).toEqual(mockChannelResponse); 
        });
    }); 

    test('pull not found', () => {
        mockPinpointResponseErr.code = 'NotFoundException'; 
        mockPinpointClient.getGcmChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelFCM.pull(mockContext, mockPinpointApp).then((e)=>{
            expect(mockPinpointClient.getGcmChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 

    test('pull other error', () => {
        mockPinpointResponseErr.code = 'otherCode'; 
        mockPinpointClient.getGcmChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelFCM.pull(mockContext, mockPinpointApp).catch((e)=>{
            expect(mockPinpointClient.getGcmChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 
});