jest.mock('../lib/pinpoint-helper', ()=>{
    return {
        console: jest.fn()
    }
});

jest.mock('../lib/multi-env-manager', ()=>{
    return {
        deletePinpointAppForEnv: jest.fn(),
        initEnv: jest.fn(),
        migrate: jest.fn()
    }
});

const pinpointHelper = require('../lib/pinpoint-helper');
const multiEnvManager = require('../lib/multi-env-manager');

const indexModule = require('../index');

describe('index', () => {
    const mockContext = {}; 

    test('console', async () => {
        await indexModule.console(mockContext); 
        expect(pinpointHelper.console).toBeCalledWith(mockContext); 
    });

    test('deletePinpointAppForEnv', async () => {
        const mockEnvName = 'mockEnvName'; 
        await indexModule.deletePinpointAppForEnv(mockContext, mockEnvName); 
        expect(multiEnvManager.deletePinpointAppForEnv).toBeCalled(); 
        expect(multiEnvManager.deletePinpointAppForEnv.mock.calls[0][0]).toBe(mockContext); 
        expect(multiEnvManager.deletePinpointAppForEnv.mock.calls[0][1]).toBe(mockEnvName); 
    });

    test('initEnv', async () => {
        await indexModule.initEnv(mockContext); 
        expect(multiEnvManager.initEnv).toBeCalledWith(mockContext); 
    });

    test('migrate', async () => {
        await indexModule.migrate(mockContext); 
        expect(multiEnvManager.migrate).toBeCalledWith(mockContext); 
    });
})