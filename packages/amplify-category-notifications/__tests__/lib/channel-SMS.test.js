const inquirer = require('inquirer');
const mockirer = require('mockirer');

const channelName = 'SMS';

const channelSMS = require('../../lib/channel-SMS'); 

describe('channel-SMS', () => {
    const mockServiceOutput = {
        Id: 'mockAppId'
    }; 
    const mockChannelOutput = { Enabled: true};

    const mockPinpointResponseErr = {
        code: 'errorCode'
    }; 

    const mockChannelResponse = {}; 
    const mockPinpointResponseData = {
        SMSChannelResponse: mockChannelResponse
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
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: true}); 
        return channelSMS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateSmsChannel).toBeCalled();
        });
    });

    test('configure enabled no change', () => {
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: false}); 
        return channelSMS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateSmsChannel).toBeCalled();
        });
    });

    test('configure disabled to enabled', () => {
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: true}); 
        return channelSMS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateSmsChannel).toBeCalled();
        });
    });

    test('configure disabled no change', () => {
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: false}); 
        return channelSMS.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateSmsChannel).not.toBeCalled();
        });
    });

    test('enable success', async () => {
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        return channelSMS.enable(mockContext, 'successMessage').then((data)=>{
            expect(mockPinpointClient.updateSmsChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    });

    test('enable failed', async () => {
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });

        return channelSMS.enable(mockContext, 'successMessage').catch((err)=>{
            expect(mockPinpointClient.updateSmsChannel).toBeCalled();
            expect(err).toEqual(mockPinpointResponseErr);
        });
    });

    test('disable success', () => {
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });
        
        return channelSMS.disable(mockContext).then((data)=>{
            expect(mockPinpointClient.updateSmsChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    }); 

    test('disable fail', () => {
        mockPinpointClient.updateSmsChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });
        
        return channelSMS.disable(mockContext).catch((err)=>{
            expect(mockPinpointClient.updateSmsChannel).toBeCalled();
            expect(err).toEqual(mockPinpointResponseErr);
        })
    });

    test('pull success', () => {
        mockPinpointClient.getSmsChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.resolve(mockPinpointResponseData)
            }; 
        });

        return channelSMS.pull(mockContext, mockPinpointApp).then((r)=>{
            expect(mockPinpointClient.getSmsChannel).toBeCalled();
            expect(r).toEqual(mockChannelResponse); 
        });
    }); 

    test('pull not found', () => {
        mockPinpointResponseErr.code = 'NotFoundException'; 
        mockPinpointClient.getSmsChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelSMS.pull(mockContext, mockPinpointApp).then((e)=>{
            expect(mockPinpointClient.getSmsChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 

    test('pull other error', () => {
        mockPinpointResponseErr.code = 'otherCode'; 
        mockPinpointClient.getSmsChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelSMS.pull(mockContext, mockPinpointApp).catch((e)=>{
            expect(mockPinpointClient.getSmsChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 
});