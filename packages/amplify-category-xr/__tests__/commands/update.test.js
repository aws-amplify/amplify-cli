const update = require('../../commands/xr/update');

describe('XR update', () => {
    const mockContext = {
        amplify: {
            getProjectDetails: jest.fn()
        },
        print: {
            info: jest.fn()
        }
    };

    it('should have a run method', () => {
        expect(update.run).toBeDefined();
    });

    it('should call getProjectDetails', async () => {
        await update.run(mockContext);
        expect(mockContext.amplify.getProjectDetails).toBeCalled();
    });

    it('should call xrManager.configure', async () => {
        const xrManager = require('../../lib/xr-manager');
        xrManager.configure = jest.fn();

        await update.run(mockContext);
        expect(xrManager.configure).toBeCalled();
    });
});
