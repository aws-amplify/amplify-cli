"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLayersToFunctionWalkthrough = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const addLayerToFunctionUtils_1 = require("../utils/addLayerToFunctionUtils");
const confirmationPrompt = 'Do you want to enable Lambda layers for this function?';
const addLayersToFunctionWalkthrough = async (context, runtime, previousSelections = [], defaultConfirm = false) => {
    let lambdaLayers = [];
    let dependsOn = [];
    if (!(await context.amplify.confirmPrompt(confirmationPrompt, defaultConfirm))) {
        return { lambdaLayers: previousSelections, dependsOn };
    }
    const result = await (0, addLayerToFunctionUtils_1.askLayerSelection)(context, amplify_cli_core_1.stateManager.getMeta(), runtime.value, previousSelections);
    ({ lambdaLayers, dependsOn } = result);
    const { askArnQuestion } = result;
    if (askArnQuestion) {
        lambdaLayers = lambdaLayers.concat(await (0, addLayerToFunctionUtils_1.askCustomArnQuestion)(lambdaLayers.length, previousSelections));
    }
    if (lambdaLayers.length === 0) {
        context.print.info('No Lambda layers were selected');
        if (previousSelections.length > 0) {
            const plural = previousSelections.length > 1 ? 's' : '';
            const removeMessage = `Removing ${previousSelections.length} previously added Lambda layer${plural} from Lambda function`;
            context.print.info(removeMessage);
        }
    }
    lambdaLayers = await (0, addLayerToFunctionUtils_1.askLayerOrderQuestion)(lambdaLayers, previousSelections);
    return { lambdaLayers, dependsOn };
};
exports.addLayersToFunctionWalkthrough = addLayersToFunctionWalkthrough;
//# sourceMappingURL=addLayerToFunctionWalkthrough.js.map