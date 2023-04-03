"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const update_1 = require("../../commands/custom/update");
const constants_1 = require("../../utils/constants");
const cloudformation_walkthrough_1 = require("../../walkthroughs/cloudformation-walkthrough");
jest.mock('../../walkthroughs/cloudformation-walkthrough');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
let mockAmplifyMeta = {
    custom: {
        mockcdkresourcename: {
            service: constants_1.CDK_SERVICE_NAME,
            providerPlugin: 'awscloudformation',
        },
        mockcfnresourcename: {
            service: constants_1.CFN_SERVICE_NAME,
            providerPlugin: 'awscloudformation',
        },
    },
};
amplify_cli_core_1.stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
amplify_cli_core_1.pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');
const updateCloudFormationWalkthrough_mock = cloudformation_walkthrough_1.updateCloudFormationWalkthrough;
describe('update custom flow', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
            },
        };
    });
    it('update custom workflow is invoked for a CFN resource', async () => {
        amplify_prompts_1.prompter.pick = jest.fn().mockReturnValueOnce('mockcfnresourcename');
        await (0, update_1.run)(mockContext);
        expect(updateCloudFormationWalkthrough_mock).toHaveBeenCalledWith(mockContext, 'mockcfnresourcename');
    });
    it('update custom workflow is invoked for a CDK resource', async () => {
        amplify_prompts_1.prompter.pick = jest.fn().mockReturnValueOnce('mockcdkresourcename');
        amplify_prompts_1.prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);
        await (0, update_1.run)(mockContext);
        expect(mockContext.amplify.openEditor).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=update.test.js.map