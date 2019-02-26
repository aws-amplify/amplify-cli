const inquirer = require('inquirer');
const mockirer = require('mockirer');

const channelName = 'Email';

const channelEmail = require('../../lib/channel-Email'); 

describe('channel-Email', () => {
    const mockServiceOutput = {
        Id: 'mockAppId'
    }; 
    const mockChannelOutput = { Enabled: true};

    const mockPinpointResponseErr = {
        code: 'errorCode'
    }; 

    const mockChannelResponse = {}; 
    const mockPinpointResponseData = {
        EmailChannelResponse: mockChannelResponse
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
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: true}); 
        
        return channelEmail.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
        });
    });

    test('configure enabled no change', () => {
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: false}); 
        
        return channelEmail.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
        });
    });

    test('configure disabled to enabled', () => {
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: true}); 
        
        return channelEmail.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
        });
    });

    test('configure disabled no change', () => {
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: false}); 
        
        return channelEmail.configure(mockContext).then(()=>{
            expect(mockPinpointClient.updateEmailChannel).not.toBeCalled();
        });
    });

    test('enable success', async () => {
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });

        mockirer(inquirer, 
            {
                FromAddress: 'MockFromAddress',
                Identity: 'MockIdentity',
                RoleArn: 'MockRoleArn'
            }
        ); 
        
        return channelEmail.enable(mockContext, 'successMessage').then((data)=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    });

    test('enable failed', async () => {
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });

        mockirer(inquirer, 
            {
                FromAddress: 'MockFromAddress',
                Identity: 'MockIdentity',
                RoleArn: 'MockRoleArn'
            }
        ); 
        
        return channelEmail.enable(mockContext, 'successMessage').catch((err)=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
            expect(err).toEqual(mockPinpointResponseErr);
        });
    });

    test('enable with inputParams success', async () => {
        mockContext.exeInfo.pinpointInputParams[channelName] = {
            FromAddress: 'MockFromAddress',
            Identity: 'MockIdentity',
            RoleArn: 'MockRoleArn'
        }
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });
        
        return channelEmail.enable(mockContext, 'successMessage').then((data)=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    });

    test('disable success', () => {
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(null, mockPinpointResponseData); 
        });
        
        return channelEmail.disable(mockContext).then((data)=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
            expect(data).toEqual(mockPinpointResponseData);
        });
    }); 

    test('disable fail', () => {
        mockPinpointClient.updateEmailChannel = jest.fn((_, callback)=>{
            callback(mockPinpointResponseErr, mockPinpointResponseData); 
        });
        
        return channelEmail.disable(mockContext).catch((err)=>{
            expect(mockPinpointClient.updateEmailChannel).toBeCalled();
            expect(err).toEqual(mockPinpointResponseErr);
        })
    });

    test('pull success', () => {
        mockPinpointClient.getEmailChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.resolve(mockPinpointResponseData)
            }; 
        });
        
        return channelEmail.pull(mockContext, mockPinpointApp).then((r)=>{
            expect(mockPinpointClient.getEmailChannel).toBeCalled();
            expect(r).toEqual(mockChannelResponse); 
        });
    }); 

    test('pull not found', () => {
        mockPinpointResponseErr.code = 'NotFoundException'; 
        mockPinpointClient.getEmailChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelEmail.pull(mockContext, mockPinpointApp).then((e)=>{
            expect(mockPinpointClient.getEmailChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 

    test('pull other error', () => {
        mockPinpointResponseErr.code = 'otherCode'; 
        mockPinpointClient.getEmailChannel = jest.fn((_)=>{
            return {
                promise: () => Promise.reject(mockPinpointResponseErr)
            }; 
        });

        return channelEmail.pull(mockContext, mockPinpointApp).catch((e)=>{
            expect(mockPinpointClient.getEmailChannel).toBeCalled();
            expect(e).toEqual(mockPinpointResponseErr); 
        })
    }); 
});