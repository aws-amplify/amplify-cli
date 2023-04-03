"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removePlaceIndexResource = exports.updatePlaceIndexResource = exports.addPlaceIndexResource = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../constants");
const constants_2 = require("../service-utils/constants");
const placeIndexParams_1 = require("../service-utils/placeIndexParams");
const placeIndexUtils_1 = require("../service-utils/placeIndexUtils");
const placeIndexWalkthrough_1 = require("../service-walkthroughs/placeIndexWalkthrough");
const removeWalkthrough_1 = require("../service-walkthroughs/removeWalkthrough");
const index_1 = require("./index");
const addPlaceIndexResource = async (context) => {
    const placeIndexParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.PlaceIndex),
    };
    await (0, placeIndexWalkthrough_1.createPlaceIndexWalkthrough)(context, placeIndexParams);
    const completeParameters = (0, placeIndexParams_1.convertToCompletePlaceIndexParams)(placeIndexParams);
    await (0, placeIndexUtils_1.createPlaceIndexResource)(context, completeParameters);
    amplify_prompts_1.printer.success(`Successfully added resource ${completeParameters.name} locally.`);
    (0, index_1.printNextStepsSuccessMessage)();
    return completeParameters.name;
};
exports.addPlaceIndexResource = addPlaceIndexResource;
const updatePlaceIndexResource = async (context) => {
    const placeIndexParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.PlaceIndex),
    };
    await (0, placeIndexWalkthrough_1.updatePlaceIndexWalkthrough)(context, placeIndexParams);
    const completeParameters = (0, placeIndexParams_1.convertToCompletePlaceIndexParams)(placeIndexParams);
    await (0, placeIndexUtils_1.modifyPlaceIndexResource)(context, completeParameters);
    amplify_prompts_1.printer.success(`Successfully updated resource ${placeIndexParams.name} locally.`);
    (0, index_1.printNextStepsSuccessMessage)();
    return completeParameters.name;
};
exports.updatePlaceIndexResource = updatePlaceIndexResource;
const removePlaceIndexResource = async (context) => {
    const resourceToRemove = await (0, removeWalkthrough_1.removeWalkthrough)(constants_2.ServiceName.PlaceIndex);
    if (!resourceToRemove)
        return undefined;
    const resourceParameters = await (0, placeIndexUtils_1.getCurrentPlaceIndexParameters)(resourceToRemove);
    const resource = await context.amplify.removeResource(context, constants_1.category, resourceToRemove);
    if ((resource === null || resource === void 0 ? void 0 : resource.service) === constants_2.ServiceName.PlaceIndex && resourceParameters.isDefault) {
        await (0, placeIndexWalkthrough_1.updateDefaultPlaceIndexWalkthrough)(context, resource === null || resource === void 0 ? void 0 : resource.resourceName);
    }
    context.amplify.updateBackendConfigAfterResourceRemove(constants_1.category, resourceToRemove);
    (0, index_1.printNextStepsSuccessMessage)();
    return resourceToRemove;
};
exports.removePlaceIndexResource = removePlaceIndexResource;
//# sourceMappingURL=placeIndex.js.map