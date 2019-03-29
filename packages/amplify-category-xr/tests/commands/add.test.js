const add = require('../../commands/xr/add');

describe('XR add', () => {
    const mockContext = {
        amplify: {
            getProjectDetails: jest.fn()
        },
        print: {
            info: jest.fn()
        }
    };

    it('should have a run method', () => {
        expect(add.run).toBeDefined();
    });

    it('should call getProjectDetails', async () => {
        await add.run(mockContext);
        expect(mockContext.amplify.getProjectDetails).toBeCalled();
    });

    it('should call xrManager.addScene', async () => {
        const xrManager = require('../../lib/xr-manager');
        xrManager.addScene = jest.fn();

        await add.run(mockContext);
        expect(xrManager.addScene).toBeCalled();
    });
});
