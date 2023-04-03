"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeGeofenceCollectionResource = exports.updateGeofenceCollectionResource = exports.addGeofenceCollectionResource = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const constants_1 = require("../constants");
const constants_2 = require("../service-utils/constants");
const geofenceCollectionParams_1 = require("../service-utils/geofenceCollectionParams");
const geofenceCollectionUtils_1 = require("../service-utils/geofenceCollectionUtils");
const geofenceCollectionWalkthrough_1 = require("../service-walkthroughs/geofenceCollectionWalkthrough");
const removeWalkthrough_1 = require("../service-walkthroughs/removeWalkthrough");
const index_1 = require("./index");
const addGeofenceCollectionResource = async (context) => {
    const geofenceCollectionParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.GeofenceCollection),
    };
    await (0, geofenceCollectionWalkthrough_1.createGeofenceCollectionWalkthrough)(context, geofenceCollectionParams);
    const completeParameters = (0, geofenceCollectionParams_1.convertToCompleteGeofenceCollectionParams)(geofenceCollectionParams);
    await (0, geofenceCollectionUtils_1.createGeofenceCollectionResource)(context, completeParameters);
    amplify_prompts_1.printer.success(`Successfully added resource ${completeParameters.name} locally.`);
    (0, index_1.printNextStepsSuccessMessage)();
    return completeParameters.name;
};
exports.addGeofenceCollectionResource = addGeofenceCollectionResource;
const updateGeofenceCollectionResource = async (context) => {
    const geofenceCollectionParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.GeofenceCollection),
    };
    await (0, geofenceCollectionWalkthrough_1.updateGeofenceCollectionWalkthrough)(context, geofenceCollectionParams);
    const completeParameters = (0, geofenceCollectionParams_1.convertToCompleteGeofenceCollectionParams)(geofenceCollectionParams);
    await (0, geofenceCollectionUtils_1.modifyGeofenceCollectionResource)(context, completeParameters);
    amplify_prompts_1.printer.success(`Successfully updated resource ${geofenceCollectionParams.name} locally.`);
    (0, index_1.printNextStepsSuccessMessage)();
    return completeParameters.name;
};
exports.updateGeofenceCollectionResource = updateGeofenceCollectionResource;
const removeGeofenceCollectionResource = async (context) => {
    const { amplify } = context;
    const resourceToRemove = await (0, removeWalkthrough_1.removeWalkthrough)(constants_2.ServiceName.GeofenceCollection);
    if (!resourceToRemove)
        return undefined;
    const resourceParameters = await (0, geofenceCollectionUtils_1.getCurrentGeofenceCollectionParameters)(resourceToRemove);
    const resource = await amplify.removeResource(context, constants_1.category, resourceToRemove);
    if ((resource === null || resource === void 0 ? void 0 : resource.service) === constants_2.ServiceName.GeofenceCollection && resourceParameters.isDefault) {
        await (0, geofenceCollectionWalkthrough_1.updateDefaultGeofenceCollectionWalkthrough)(context, resource === null || resource === void 0 ? void 0 : resource.resourceName);
    }
    context.amplify.updateBackendConfigAfterResourceRemove(constants_1.category, resourceToRemove);
    (0, index_1.printNextStepsSuccessMessage)();
    return resourceToRemove;
};
exports.removeGeofenceCollectionResource = removeGeofenceCollectionResource;
//# sourceMappingURL=geofenceCollection.js.map