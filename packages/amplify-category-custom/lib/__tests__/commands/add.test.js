"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const add_1 = require("../../commands/custom/add");
const common_questions_1 = require("../../utils/common-questions");
const constants_1 = require("../../utils/constants");
const cdk_walkthrough_1 = require("../../walkthroughs/cdk-walkthrough");
const cloudformation_walkthrough_1 = require("../../walkthroughs/cloudformation-walkthrough");
jest.mock('../../utils/common-questions');
jest.mock('../../walkthroughs/cloudformation-walkthrough');
jest.mock('../../walkthroughs/cdk-walkthrough');
const addCloudFormationWalkthrough_mock = cloudformation_walkthrough_1.addCloudFormationWalkthrough;
const addCDKWalkthrough_mock = cdk_walkthrough_1.addCDKWalkthrough;
const customDeploymentOptionsQuestion_mock = common_questions_1.customDeploymentOptionsQuestion;
describe('add custom flow', () => {
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            amplify: {},
        };
    });
    it('add custom workflow is invoked for CDK', async () => {
        customDeploymentOptionsQuestion_mock.mockResolvedValueOnce(constants_1.CDK_DEPLOYMENT_NAME);
        await (0, add_1.run)(mockContext);
        expect(addCDKWalkthrough_mock).toHaveBeenCalledTimes(1);
    });
    it('add custom workflow is invoked for CFN', async () => {
        customDeploymentOptionsQuestion_mock.mockResolvedValueOnce(constants_1.CFN_DEPLOYMENT_NAME);
        await (0, add_1.run)(mockContext);
        expect(addCloudFormationWalkthrough_mock).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=add.test.js.map