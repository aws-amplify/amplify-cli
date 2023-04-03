"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_1 = require("../../commands/custom/build");
const build_custom_resources_1 = require("../../utils/build-custom-resources");
jest.mock('../../utils/build-custom-resources');
const buildCustomResources_mock = build_custom_resources_1.buildCustomResources;
describe('build custom resources flow', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
            parameters: {},
        };
    });
    it('build all custom resources', async () => {
        await (0, build_1.run)(mockContext);
        expect(buildCustomResources_mock).toHaveBeenCalledWith(mockContext, undefined);
    });
    it('build one custom resource', async () => {
        const mockResourceName = 'mockresourcename';
        mockContext.parameters.first = mockResourceName;
        await (0, build_1.run)(mockContext);
        expect(buildCustomResources_mock).toHaveBeenCalledWith(mockContext, mockResourceName);
    });
});
//# sourceMappingURL=build.test.js.map