"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const constants_1 = require("../../constants");
const functionSecretsStateManager_1 = require("../../provider-utils/awscloudformation/secrets/functionSecretsStateManager");
const funcionStateUtils_1 = require("../../provider-utils/awscloudformation/utils/funcionStateUtils");
const removeFunctionWalkthrough_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/removeFunctionWalkthrough");
const removeLayerWalkthrough_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/removeLayerWalkthrough");
const subcommand = 'remove';
exports.name = subcommand;
const run = async (context) => {
    const { amplify, parameters } = context;
    let resourceName = parameters.first;
    let resourceToBeDeleted = '';
    const response = await (0, removeFunctionWalkthrough_1.removeResource)(resourceName);
    if (response.isLambdaLayer) {
        context.print.info('When you delete a layer version, you can no longer configure functions to use it.\nHowever, any function that already uses the layer version continues to have access to it.');
        resourceToBeDeleted = await (0, removeLayerWalkthrough_1.removeWalkthrough)(context, response.resourceName);
        if (!resourceToBeDeleted) {
            return undefined;
        }
        resourceName = resourceToBeDeleted;
    }
    else {
        resourceName = response.resourceName;
    }
    let hasSecrets = false;
    const resourceNameCallback = async (funcName) => {
        hasSecrets = (0, functionSecretsStateManager_1.getLocalFunctionSecretNames)(funcName).length > 0;
    };
    return amplify
        .removeResource(context, constants_1.categoryName, resourceName, undefined, resourceNameCallback)
        .then(async () => {
        if (!(0, funcionStateUtils_1.isFunctionPushed)(resourceName) && hasSecrets) {
            await (await functionSecretsStateManager_1.FunctionSecretsStateManager.getInstance(context)).deleteAllFunctionSecrets(resourceName);
        }
    })
        .catch((err) => {
        if (err.stack) {
            context.print.info(err.stack);
            context.print.error('An error occurred when removing the function resource');
        }
        void context.usageData.emitError(err);
        process.exitCode = 1;
    });
};
exports.run = run;
//# sourceMappingURL=remove.js.map