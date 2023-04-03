"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const remove_1 = require("../../commands/storage/remove");
const providerController = __importStar(require("../../provider-utils/awscloudformation/index"));
jest.mock('../../provider-utils/awscloudformation/index');
jest.mock('amplify-cli-core');
const providerController_mock = providerController;
providerController_mock.updateResource.mockImplementation = jest.fn().mockImplementation(async () => {
    return 'mockResourceName';
});
describe('remove ddb command tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
            parameters: {},
        };
    });
    it('update resource workflow is invoked for DDB with no params', async () => {
        mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
            return;
        });
        await (0, remove_1.run)(mockContext);
        expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', undefined);
    });
    it('update resource workflow is invoked for DDB with params as resourceName', async () => {
        const mockResourceName = 'mockResourceName';
        mockContext.parameters.first = mockResourceName;
        mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
            return;
        });
        await (0, remove_1.run)(mockContext);
        expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', mockResourceName);
    });
});
describe('remove s3 command tests', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
            parameters: {},
        };
    });
    it('update resource workflow is invoked for s3 with no params', async () => {
        mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
            return;
        });
        await (0, remove_1.run)(mockContext);
        expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', undefined);
    });
    it('update resource workflow is invoked for s3 with params as resourceName', async () => {
        const mockResourceName = 'mockResourceName';
        mockContext.parameters.first = mockResourceName;
        mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
            return;
        });
        await (0, remove_1.run)(mockContext);
        expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', mockResourceName);
    });
});
//# sourceMappingURL=remove.test.js.map