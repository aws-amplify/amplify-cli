const inquirer = require('inquirer');
const mockirer = require('mockirer');
const configureKey = require('../../lib/apns-key-config');
const configureCertificate = require('../../lib/apns-cert-config');

const channelName = 'APNS';

const channelAPNS = require('../../lib/channel-APNS'); 

describe('channel-APNS', () => {
    const mockServiceOutput = {}; 
    const mockChannelOutput = { Enabled: true};
    const mockPinpointClient = {
        updateApnsChannel: jest.fn((params, callback)=>{
            callback(null, {}); 
        })
    }
    mockServiceOutput[channelName] = mockChannelOutput;
    
    const mockContext = {
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

    beforeAll(() => {
        configureKey.run = jest.fn();
        configureCertificate.run = jest.fn(); 
    }); 

    beforeEach(() => {
    });

    test('configure enabled to disable', async () => {
        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: true}); 

        await channelAPNS.configure(mockContext); 

        expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
    test('configure enabled to configure', async () => {
        mockChannelOutput.Enabled = true; 
        mockirer(inquirer, {disableChannel: false}); 

        await channelAPNS.configure(mockContext); 

        expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
    test('configure disabled to enable', async () => {
        mockChannelOutput.Enabled = false; 
        mockirer(inquirer, {enableChannel: true}); 

        await channelAPNS.configure(mockContext); 

        expect(mockPinpointClient.updateApnsChannel).toBeCalled();
    });
});