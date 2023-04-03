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
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const console_1 = require("../../commands/storage/console");
const providerController = __importStar(require("../../provider-utils/awscloudformation/index"));
jest.mock('../../provider-utils/awscloudformation/index');
jest.mock('amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
const providerControllerMock = providerController;
const getMetaMock = amplify_cli_core_1.stateManager.getMeta;
const printerMock = amplify_prompts_1.printer;
describe('console command tests', () => {
    const provider = 'awscloudformation';
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
        };
    });
    it('calls open console', async () => {
        const amplifyMetaMock = {
            storage: {
                TestTable: {
                    service: 'DynamoDB',
                    providerPlugin: 'awscloudformation',
                },
            },
        };
        getMetaMock.mockReturnValue(amplifyMetaMock);
        const service = 'DynamoDB';
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => ({ service, providerName: provider }));
        await (0, console_1.run)(mockContext);
        expect(providerControllerMock.console).toHaveBeenCalledWith(amplifyMetaMock, provider, service);
    });
    it('print error message when no resources in storage category', async () => {
        getMetaMock.mockReturnValue({});
        const service = 'DynamoDB';
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => ({ service, providerName: provider }));
        await (0, console_1.run)(mockContext);
        expect(printerMock.error).toBeCalledWith('Storage has NOT been added to this project.');
        expect(providerControllerMock.console).not.toBeCalled();
    });
});
//# sourceMappingURL=console.test.js.map