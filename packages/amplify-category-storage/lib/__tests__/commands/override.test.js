"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("amplify-cli-core");
const override_1 = require("../../commands/storage/override");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const path_1 = __importDefault(require("path"));
const dynamoDB_input_state_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state");
const s3_user_input_state_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state");
jest.mock('amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('path');
jest.mock('../../provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state');
jest.mock('../../provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform');
jest.mock('../../provider-utils/awscloudformation/service-walkthroughs/s3-user-input-state');
jest.mock('../../provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform');
const generateOverrideSkeleton_mock = amplify_cli_core_1.generateOverrideSkeleton;
generateOverrideSkeleton_mock.mockImplementation = jest.fn().mockImplementation(async () => {
    return 'mockResourceName';
});
describe('override ddb command tests', () => {
    let mockContext;
    let mockAmplifyMeta = {};
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
        };
    });
    it('override ddb when two ddb storage resources present', async () => {
        mockAmplifyMeta = {
            storage: {
                dynamo73399689: {
                    service: amplify_cli_core_1.AmplifySupportedService.DYNAMODB,
                    providerPlugin: 'awscloudformation',
                },
                dynamoefb50875: {
                    service: amplify_cli_core_1.AmplifySupportedService.DYNAMODB,
                    providerPlugin: 'awscloudformation',
                },
            },
        };
        const destDir = 'mockDir';
        const srcDir = 'mockSrcDir';
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        amplify_cli_core_1.pathManager.getResourceDirectoryPath = jest.fn().mockReturnValue(destDir);
        path_1.default.join = jest.fn().mockReturnValue(srcDir);
        amplify_prompts_1.prompter.pick = jest.fn().mockReturnValue('dynamo73399689');
        jest.spyOn(dynamoDB_input_state_1.DynamoDBInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        await (0, override_1.run)(mockContext);
        expect(amplify_prompts_1.prompter.pick).toBeCalledTimes(1);
        expect(amplify_cli_core_1.generateOverrideSkeleton).toHaveBeenCalledWith(mockContext, srcDir, destDir);
    });
    it('override ddb when one ddb storage resource present', async () => {
        mockAmplifyMeta = {
            storage: {
                dynamo73399689: {
                    service: 'DynamoDB',
                    providerPlugin: 'awscloudformation',
                },
            },
        };
        const destDir = 'mockDir';
        const srcDir = 'mockSrcDir';
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        amplify_cli_core_1.pathManager.getResourceDirectoryPath = jest.fn().mockReturnValue(destDir);
        path_1.default.join = jest.fn().mockReturnValue(srcDir);
        jest.spyOn(dynamoDB_input_state_1.DynamoDBInputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        await (0, override_1.run)(mockContext);
        expect(amplify_prompts_1.prompter.pick).toBeCalledTimes(0);
        expect(amplify_cli_core_1.generateOverrideSkeleton).toHaveBeenCalledWith(mockContext, srcDir, destDir);
    });
    it('override ddb when no ddb storage resource present', async () => {
        mockAmplifyMeta = {};
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        await (0, override_1.run)(mockContext);
        expect(amplify_prompts_1.printer.error).toHaveBeenCalledWith('No resources to override. You need to add a resource.');
    });
});
describe('override s3 command tests', () => {
    let mockContext;
    let mockAmplifyMeta = {};
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
        };
    });
    it('override s3 when one s3 storage resource present', async () => {
        mockAmplifyMeta = {
            storage: {
                s351182c15: {
                    service: amplify_cli_core_1.AmplifySupportedService.S3,
                    providerPlugin: 'awscloudformation',
                },
            },
        };
        const destDir = 'mockDir';
        const srcDir = 'mockSrcDir';
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        amplify_cli_core_1.pathManager.getResourceDirectoryPath = jest.fn().mockReturnValue(destDir);
        path_1.default.join = jest.fn().mockReturnValue(srcDir);
        jest.spyOn(s3_user_input_state_1.S3InputState.prototype, 'cliInputFileExists').mockImplementation(() => true);
        await (0, override_1.run)(mockContext);
        expect(amplify_prompts_1.prompter.pick).toBeCalledTimes(0);
        expect(amplify_cli_core_1.generateOverrideSkeleton).toHaveBeenCalledWith(mockContext, srcDir, destDir);
    });
    it('override s3 when no s3 storage resource present', async () => {
        mockAmplifyMeta = {};
        amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
        await (0, override_1.run)(mockContext);
        expect(amplify_prompts_1.printer.error).toHaveBeenCalledWith('No resources to override. You need to add a resource.');
    });
});
//# sourceMappingURL=override.test.js.map