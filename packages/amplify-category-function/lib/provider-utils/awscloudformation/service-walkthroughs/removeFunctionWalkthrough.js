"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeResource = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const constants_1 = require("../../../constants");
async function removeResource(resourceName) {
    const enabledCategoryResources = getEnabledResources();
    if (enabledCategoryResources.length === 0) {
        throw new amplify_cli_core_1.AmplifyError('ResourceDoesNotExistError', {
            message: 'No Lambda function resource to remove. Use "amplify add function" to create a new function.',
        });
    }
    if (resourceName) {
        const resource = enabledCategoryResources.find((categoryResource) => categoryResource.value.resourceName === resourceName);
        return resource.value;
    }
    const question = [
        {
            name: 'resource',
            message: 'Choose the resource you would want to remove',
            type: 'list',
            choices: enabledCategoryResources,
        },
    ];
    const answer = await inquirer_1.default.prompt(question);
    return answer.resource;
}
exports.removeResource = removeResource;
function getEnabledResources() {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    return (0, amplify_cli_core_1.getAmplifyResourceByCategories)(constants_1.categoryName).map((resource) => {
        const service = lodash_1.default.get(amplifyMeta, [constants_1.categoryName, resource, 'service']);
        return {
            name: `${resource} ${service === "LambdaLayer" ? '(layer)' : '(function)'}`,
            value: { resourceName: resource, isLambdaLayer: service === "LambdaLayer" },
        };
    });
}
//# sourceMappingURL=removeFunctionWalkthrough.js.map