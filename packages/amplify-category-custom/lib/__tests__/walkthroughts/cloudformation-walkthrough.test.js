"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const common_questions_1 = require("../../utils/common-questions");
const cloudformation_walkthrough_1 = require("../../walkthroughs/cloudformation-walkthrough");
jest.mock('../../utils/common-questions');
jest.mock('../../utils/build-custom-resources');
jest.mock('../../utils/dependency-management-utils');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('fs-extra', () => ({
    readFileSync: jest.fn().mockReturnValue('mockCode'),
    existsSync: jest.fn().mockReturnValue(false),
    ensureDirSync: jest.fn().mockReturnValue(true),
    writeFileSync: jest.fn().mockReturnValue(true),
}));
amplify_cli_core_1.pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');
let customResourceNameQuestion_mock = common_questions_1.customResourceNameQuestion;
customResourceNameQuestion_mock.mockResolvedValue('customresoourcename');
describe('addCFNWalkthrough scenarios', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
                updateamplifyMetaAfterResourceAdd: jest.fn(),
                copyBatch: jest.fn(),
            },
        };
    });
    it('successfully goes through cdk update walkthrough', async () => {
        amplify_prompts_1.prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);
        await (0, cloudformation_walkthrough_1.addCloudFormationWalkthrough)(mockContext);
        expect(mockContext.amplify.openEditor).toHaveBeenCalledTimes(1);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceAdd).toHaveBeenCalledTimes(1);
        expect(mockContext.amplify.copyBatch).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=cloudformation-walkthrough.test.js.map