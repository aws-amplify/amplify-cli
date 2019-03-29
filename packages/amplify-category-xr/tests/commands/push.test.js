const push = require('../../commands/xr/push');

describe('XR push', () => {
    const mockContext = {
        amplify: {
            constructExeInfo: jest.fn(),
            pushResources: jest.fn(() => Promise.resolve({}))
        },
        parameters: {
            first: 'resourceName'
        },
        print: {
            info: jest.fn()
        }
    };

    it('should have a run method', () => {
        expect(push.run).toBeDefined();
    });

    it('should call constructExeInfo', async () => {
        await push.run(mockContext);
        expect(mockContext.amplify.constructExeInfo).toBeCalled();
    });

    it('should call pushResources', async () => {
        await push.run(mockContext);
        expect(mockContext.amplify.pushResources).toBeCalled();
    });
});