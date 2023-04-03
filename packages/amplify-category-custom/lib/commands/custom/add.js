"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const common_questions_1 = require("../../utils/common-questions");
const cdk_walkthrough_1 = require("../../walkthroughs/cdk-walkthrough");
const cloudformation_walkthrough_1 = require("../../walkthroughs/cloudformation-walkthrough");
exports.name = 'add';
async function run(context) {
    const deploymentOption = await (0, common_questions_1.customDeploymentOptionsQuestion)();
    if (deploymentOption === 'AWS CDK') {
        await (0, cdk_walkthrough_1.addCDKWalkthrough)(context);
    }
    else if (deploymentOption === 'AWS CloudFormation') {
        await (0, cloudformation_walkthrough_1.addCloudFormationWalkthrough)(context);
    }
}
exports.run = run;
//# sourceMappingURL=add.js.map