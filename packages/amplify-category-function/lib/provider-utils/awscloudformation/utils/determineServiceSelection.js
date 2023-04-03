"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.determineServiceSelection = void 0;
const constants_1 = require("../../../constants");
const supported_services_1 = require("../../supported-services");
const determineServiceSelection = async (context, chooseServiceMessage) => {
    const { allResources } = await context.amplify.getResourceStatus();
    const lambdaLayerExists = allResources.filter((resource) => resource.service === "LambdaLayer").length > 0;
    const lambdaFunctionExists = allResources.filter((resource) => resource.service === "Lambda" && resource.mobileHubMigrated !== true).length > 0;
    if ((!lambdaFunctionExists && !lambdaLayerExists) || (lambdaFunctionExists && !lambdaLayerExists)) {
        return {
            service: "Lambda",
        };
    }
    if (!lambdaFunctionExists && lambdaLayerExists) {
        return {
            service: "LambdaLayer",
        };
    }
    return await context.amplify.serviceSelectionPrompt(context, constants_1.categoryName, supported_services_1.supportedServices, chooseServiceMessage);
};
exports.determineServiceSelection = determineServiceSelection;
//# sourceMappingURL=determineServiceSelection.js.map