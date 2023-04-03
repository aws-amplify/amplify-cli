"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDefaultPlaceIndexWalkthrough = exports.updatePlaceIndexWalkthrough = exports.placeIndexDataStorageWalkthrough = exports.placeIndexAdvancedWalkthrough = exports.placeIndexNameWalkthrough = exports.createPlaceIndexWalkthrough = void 0;
const uuid_1 = require("uuid");
const resourceUtils_1 = require("../service-utils/resourceUtils");
const placeIndexParams_1 = require("../service-utils/placeIndexParams");
const constants_1 = require("../service-utils/constants");
const placeIndexUtils_1 = require("../service-utils/placeIndexUtils");
const resourceUtils_2 = require("../service-utils/resourceUtils");
const resourceWalkthrough_1 = require("./resourceWalkthrough");
const resourceParams_1 = require("../service-utils/resourceParams");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const searchServiceFriendlyName = (0, resourceWalkthrough_1.getServiceFriendlyName)(constants_1.ServiceName.PlaceIndex);
const createPlaceIndexWalkthrough = async (context, parameters) => {
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.placeIndexNameWalkthrough)());
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, resourceWalkthrough_1.resourceAccessWalkthrough)(context, parameters, constants_1.ServiceName.PlaceIndex));
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.placeIndexAdvancedWalkthrough)(context, parameters));
    const currentPlaceIndexResources = await (0, resourceUtils_2.getGeoServiceMeta)(constants_1.ServiceName.PlaceIndex);
    if (currentPlaceIndexResources && Object.keys(currentPlaceIndexResources).length > 0) {
        parameters.isDefault = await amplify_prompts_1.prompter.yesOrNo((0, resourceWalkthrough_1.defaultResourceQuestion)(constants_1.ServiceName.PlaceIndex), true);
    }
    else {
        parameters.isDefault = true;
    }
    return parameters;
};
exports.createPlaceIndexWalkthrough = createPlaceIndexWalkthrough;
const placeIndexNameWalkthrough = async () => {
    let indexName;
    while (!indexName) {
        const [shortId] = (0, uuid_1.v4)().split('-');
        const indexNameInput = await amplify_prompts_1.prompter.input('Provide a name for the location search index (place index):', {
            validate: (0, amplify_prompts_1.alphanumeric)(),
            initial: `placeIndex${shortId}`,
        });
        if (await (0, resourceUtils_2.checkGeoResourceExists)(indexNameInput)) {
            amplify_prompts_1.printer.info(`Geo resource ${indexNameInput} already exists. Choose another name.`);
        }
        else
            indexName = indexNameInput;
    }
    return { name: indexName };
};
exports.placeIndexNameWalkthrough = placeIndexNameWalkthrough;
const placeIndexAdvancedWalkthrough = async (context, parameters) => {
    const advancedSettingOptions = ['Search data provider (default: HERE)'];
    advancedSettingOptions.push('Search result storage location (default: no result storage)');
    amplify_prompts_1.printer.info('Available advanced settings:');
    amplify_prompts_1.formatter.list(advancedSettingOptions);
    amplify_prompts_1.printer.blankLine();
    if (await amplify_prompts_1.prompter.yesOrNo('Do you want to configure advanced settings?', false)) {
        parameters = (0, resourceUtils_1.merge)(parameters, await (0, resourceWalkthrough_1.dataProviderWalkthrough)(parameters, constants_1.ServiceName.PlaceIndex));
        parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.placeIndexDataStorageWalkthrough)(parameters));
    }
    else {
        parameters.dataProvider = resourceParams_1.DataProvider.Here;
        parameters.dataSourceIntendedUse = placeIndexParams_1.DataSourceIntendedUse.SingleUse;
    }
    return parameters;
};
exports.placeIndexAdvancedWalkthrough = placeIndexAdvancedWalkthrough;
const placeIndexDataStorageWalkthrough = async (parameters) => {
    const areResultsStored = await amplify_prompts_1.prompter.yesOrNo(`Do you want to cache or store the results of search operations? Refer ${constants_1.apiDocs.dataSourceUsage}`, parameters.dataSourceIntendedUse === placeIndexParams_1.DataSourceIntendedUse.Storage);
    const intendedUse = areResultsStored ? placeIndexParams_1.DataSourceIntendedUse.Storage : placeIndexParams_1.DataSourceIntendedUse.SingleUse;
    return { dataSourceIntendedUse: intendedUse };
};
exports.placeIndexDataStorageWalkthrough = placeIndexDataStorageWalkthrough;
const updatePlaceIndexWalkthrough = async (context, parameters, resourceToUpdate) => {
    const indexResourceNames = await (0, resourceUtils_2.getGeoResources)(constants_1.ServiceName.PlaceIndex);
    if (indexResourceNames.length === 0) {
        amplify_prompts_1.printer.error(`No ${searchServiceFriendlyName} resource to update. Use "amplify add geo" to create a new ${searchServiceFriendlyName}.`);
        return parameters;
    }
    if (resourceToUpdate) {
        if (!indexResourceNames.includes(resourceToUpdate)) {
            amplify_prompts_1.printer.error(`No ${searchServiceFriendlyName} named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        resourceToUpdate = await amplify_prompts_1.prompter.pick(`Select the ${searchServiceFriendlyName} you want to update`, indexResourceNames);
    }
    parameters.name = resourceToUpdate;
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, placeIndexUtils_1.getCurrentPlaceIndexParameters)(resourceToUpdate));
    const placeIndexAccessSettings = await (0, resourceWalkthrough_1.resourceAccessWalkthrough)(context, parameters, constants_1.ServiceName.PlaceIndex);
    parameters.accessType = placeIndexAccessSettings.accessType;
    parameters.groupPermissions = placeIndexAccessSettings.groupPermissions;
    const otherIndexResources = indexResourceNames.filter((indexResourceName) => indexResourceName !== resourceToUpdate);
    if (otherIndexResources.length > 0) {
        const isDefault = await amplify_prompts_1.prompter.yesOrNo((0, resourceWalkthrough_1.defaultResourceQuestion)(constants_1.ServiceName.PlaceIndex), true);
        if (parameters.isDefault && !isDefault) {
            await (0, exports.updateDefaultPlaceIndexWalkthrough)(context, resourceToUpdate, otherIndexResources);
        }
        parameters.isDefault = isDefault;
    }
    else {
        parameters.isDefault = true;
    }
    return parameters;
};
exports.updatePlaceIndexWalkthrough = updatePlaceIndexWalkthrough;
const updateDefaultPlaceIndexWalkthrough = async (context, currentDefault, availablePlaceIndices) => {
    if (!availablePlaceIndices) {
        availablePlaceIndices = await (0, resourceUtils_2.getGeoResources)(constants_1.ServiceName.PlaceIndex);
    }
    const otherIndexResources = availablePlaceIndices.filter((indexResourceName) => indexResourceName !== currentDefault);
    if ((otherIndexResources === null || otherIndexResources === void 0 ? void 0 : otherIndexResources.length) > 0) {
        const defaultIndexName = await amplify_prompts_1.prompter.pick(`Select the ${searchServiceFriendlyName} you want to set as default:`, otherIndexResources);
        await (0, resourceUtils_2.updateDefaultResource)(context, constants_1.ServiceName.PlaceIndex, defaultIndexName);
    }
    return currentDefault;
};
exports.updateDefaultPlaceIndexWalkthrough = updateDefaultPlaceIndexWalkthrough;
//# sourceMappingURL=placeIndexWalkthrough.js.map