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
const update_1 = require("../../commands/storage/update");
const providerController = __importStar(require("../../provider-utils/awscloudformation/index"));
jest.mock('../../provider-utils/awscloudformation/index');
jest.mock('amplify-cli-core');
const providerController_mock = providerController;
providerController_mock.updateResource.mockImplementation = jest.fn().mockImplementation(async () => {
    return 'mockResourceName';
});
describe('update ddb command tests', () => {
    const provider = 'awscloudformation';
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
        };
    });
    it('update resource workflow is invoked for DDB', async () => {
        const service = 'DynamoDB';
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
            return { service: service, providerName: provider };
        });
        await (0, update_1.run)(mockContext);
        expect(providerController_mock.updateResource).toHaveBeenCalledWith(mockContext, 'storage', service);
    });
});
describe('update s3 command tests', () => {
    const provider = 'awscloudformation';
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
        };
    });
    it('update resource workflow is invoked for S3', async () => {
        const service = 'S3';
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
            return { service: service, providerName: provider };
        });
        await (0, update_1.run)(mockContext);
        expect(providerController_mock.updateResource).toHaveBeenCalledWith(mockContext, 'storage', service);
    });
});
//# sourceMappingURL=update.test.js.map