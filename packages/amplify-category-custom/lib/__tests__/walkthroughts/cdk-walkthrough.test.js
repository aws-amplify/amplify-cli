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
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const build_custom_resources_1 = require("../../utils/build-custom-resources");
const common_questions_1 = require("../../utils/common-questions");
const cdk_walkthrough_1 = require("../../walkthroughs/cdk-walkthrough");
jest.mock('../../utils/common-questions');
jest.mock('../../utils/build-custom-resources');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');
jest.mock('fs-extra', () => ({
    readFileSync: jest.fn().mockReturnValue('mockCode'),
    existsSync: jest.fn().mockReturnValue(false),
    ensureDirSync: jest.fn().mockReturnValue(true),
    writeFileSync: jest.fn().mockReturnValue(true),
}));
amplify_cli_core_1.pathManager.getBackendDirPath = jest.fn().mockReturnValue('mockTargetDir');
(amplify_cli_core_1.JSONUtilities.writeJson = jest.fn()), (amplify_cli_core_1.JSONUtilities.readJson = jest.fn());
const buildCustomResources_mock = build_custom_resources_1.buildCustomResources;
let customResourceNameQuestion_mock = common_questions_1.customResourceNameQuestion;
customResourceNameQuestion_mock.mockResolvedValue('customresoourcename');
describe('addCDKWalkthrough scenarios', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {
                openEditor: jest.fn(),
                updateamplifyMetaAfterResourceAdd: jest.fn(),
            },
        };
    });
    it('successfully goes through cdk update walkthrough', async () => {
        amplify_prompts_1.prompter.yesOrNo = jest.fn().mockReturnValueOnce(true);
        await (0, cdk_walkthrough_1.addCDKWalkthrough)(mockContext);
        expect(buildCustomResources_mock).toHaveBeenCalledWith(mockContext, 'customresoourcename');
        expect(mockContext.amplify.openEditor).toHaveBeenCalledTimes(1);
        expect(mockContext.amplify.updateamplifyMetaAfterResourceAdd).toHaveBeenCalledTimes(1);
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=cdk-walkthrough.test.js.map