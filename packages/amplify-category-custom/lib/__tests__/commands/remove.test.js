"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const remove_1 = require("../../commands/custom/remove");
jest.mock('@aws-amplify/amplify-cli-core');
describe('remove custom resource command tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
            parameters: {},
        };
    });
    it('remove resource workflow is invoked for custom resources with no params', async () => {
        mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
            return;
        });
        await (0, remove_1.run)(mockContext);
        expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'custom', undefined);
    });
    it('remove resource workflow is invoked for custom resource with params as resourceName', async () => {
        const mockResourceName = 'mockResourceName';
        mockContext.parameters.first = mockResourceName;
        mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
            return;
        });
        await (0, remove_1.run)(mockContext);
        expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'custom', mockResourceName);
    });
});
//# sourceMappingURL=remove.test.js.map