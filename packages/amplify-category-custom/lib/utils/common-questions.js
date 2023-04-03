"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customResourceNameQuestion = exports.customDeploymentOptionsQuestion = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const uuid_1 = require("uuid");
const constants_1 = require("../utils/constants");
async function customDeploymentOptionsQuestion() {
    const deploymentOption = await amplify_prompts_1.prompter.pick('How do you want to define this custom resource?', constants_1.customDeploymentOptions);
    return deploymentOption;
}
exports.customDeploymentOptionsQuestion = customDeploymentOptionsQuestion;
async function customResourceNameQuestion() {
    const [shortId] = (0, uuid_1.v4)().split('-');
    const defaultResourceName = `customResource${shortId}`;
    const resourceName = await amplify_prompts_1.prompter.input('Provide a name for your custom resource', {
        initial: defaultResourceName,
        validate: (0, amplify_prompts_1.alphanumeric)(),
    });
    return resourceName;
}
exports.customResourceNameQuestion = customResourceNameQuestion;
//# sourceMappingURL=common-questions.js.map