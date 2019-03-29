const remove = require('../../commands/xr/remove');

describe('XR remove', () => {
    const mockContext = {
        amplify: {
            getProjectDetails: jest.fn()
        },
        print: {
            info: jest.fn()
        }
    };

    it('should have a run method', () => {
        expect(remove.run).toBeDefined();
    });

    it('should call getProjectDetails', async () => {
        await remove.run(mockContext);
        expect(mockContext.amplify.getProjectDetails).toBeCalled();
    });

    it('should call xrManager.remove', async () => {
        const xrManager = require('../../lib/xr-manager');
        xrManager.remove = jest.fn();

        await remove.run(mockContext);
        expect(xrManager.remove).toBeCalled();
    });
});
