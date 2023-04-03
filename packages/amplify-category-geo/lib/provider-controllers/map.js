"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMapResourceWithParams = exports.addMapResourceWithParams = exports.updateMapResourceHeadless = exports.addMapResourceHeadless = exports.removeMapResource = exports.updateMapResource = exports.addMapResource = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const mapUtils_1 = require("../service-utils/mapUtils");
const removeWalkthrough_1 = require("../service-walkthroughs/removeWalkthrough");
const constants_1 = require("../constants");
const mapWalkthrough_1 = require("../service-walkthroughs/mapWalkthrough");
const mapParams_1 = require("../service-utils/mapParams");
const index_1 = require("./index");
const constants_2 = require("../service-utils/constants");
const mapParams_2 = require("../service-utils/mapParams");
const resourceUtils_1 = require("../service-utils/resourceUtils");
const addMapResource = async (context) => {
    const mapParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.Map),
    };
    await (0, mapWalkthrough_1.createMapWalkthrough)(context, mapParams);
    return (0, exports.addMapResourceWithParams)(context, mapParams);
};
exports.addMapResource = addMapResource;
const updateMapResource = async (context) => {
    const mapParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.Map),
    };
    await (0, mapWalkthrough_1.updateMapWalkthrough)(context, mapParams);
    return (0, exports.updateMapResourceWithParams)(context, mapParams);
};
exports.updateMapResource = updateMapResource;
const removeMapResource = async (context) => {
    const { amplify } = context;
    const resourceToRemove = await (0, removeWalkthrough_1.removeWalkthrough)(constants_2.ServiceName.Map);
    if (!resourceToRemove)
        return undefined;
    const resourceParameters = await (0, mapUtils_1.getCurrentMapParameters)(resourceToRemove);
    const resource = await amplify.removeResource(context, constants_1.category, resourceToRemove);
    if ((resource === null || resource === void 0 ? void 0 : resource.service) === constants_2.ServiceName.Map && resourceParameters.isDefault) {
        await (0, mapWalkthrough_1.updateDefaultMapWalkthrough)(context, resource === null || resource === void 0 ? void 0 : resource.resourceName);
    }
    context.amplify.updateBackendConfigAfterResourceRemove(constants_1.category, resourceToRemove);
    (0, index_1.printNextStepsSuccessMessage)();
    return resourceToRemove;
};
exports.removeMapResource = removeMapResource;
const addMapResourceHeadless = async (context, config) => {
    const mapParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.Map),
        name: config.name,
        accessType: config.accessType,
        isDefault: config.setAsDefault,
        ...(0, mapParams_2.getMapStyleComponents)(config.mapStyle),
    };
    return (0, exports.addMapResourceWithParams)(context, mapParams);
};
exports.addMapResourceHeadless = addMapResourceHeadless;
const updateMapResourceHeadless = async (context, config) => {
    let mapParams = {
        providerContext: (0, index_1.setProviderContext)(context, constants_2.ServiceName.Map),
        name: config.name,
        accessType: config.accessType,
        isDefault: config.setAsDefault,
    };
    mapParams = (0, resourceUtils_1.merge)(mapParams, await (0, mapUtils_1.getCurrentMapParameters)(config.name));
    return (0, exports.updateMapResourceWithParams)(context, mapParams);
};
exports.updateMapResourceHeadless = updateMapResourceHeadless;
const addMapResourceWithParams = async (context, mapParams) => {
    const completeParameters = (0, mapParams_1.convertToCompleteMapParams)(mapParams);
    await (0, mapUtils_1.createMapResource)(context, completeParameters);
    amplify_prompts_1.printer.success(`Successfully added resource ${completeParameters.name} locally.`);
    (0, index_1.printNextStepsSuccessMessage)();
    return completeParameters.name;
};
exports.addMapResourceWithParams = addMapResourceWithParams;
const updateMapResourceWithParams = async (context, mapParams) => {
    const completeParameters = (0, mapParams_1.convertToCompleteMapParams)(mapParams);
    await (0, mapUtils_1.modifyMapResource)(context, completeParameters);
    amplify_prompts_1.printer.success(`Successfully updated resource ${mapParams.name} locally.`);
    (0, index_1.printNextStepsSuccessMessage)();
    return completeParameters.name;
};
exports.updateMapResourceWithParams = updateMapResourceWithParams;
//# sourceMappingURL=map.js.map