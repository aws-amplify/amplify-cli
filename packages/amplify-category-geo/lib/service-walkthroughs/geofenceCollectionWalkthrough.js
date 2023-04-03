"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateDefaultGeofenceCollectionWalkthrough = exports.updateGeofenceCollectionWalkthrough = exports.geofenceCollectionAccessWalkthrough = exports.geofenceCollectionNameWalkthrough = exports.createGeofenceCollectionWalkthrough = void 0;
const uuid_1 = require("uuid");
const resourceUtils_1 = require("../service-utils/resourceUtils");
const constants_1 = require("../service-utils/constants");
const geofenceCollectionUtils_1 = require("../service-utils/geofenceCollectionUtils");
const resourceUtils_2 = require("../service-utils/resourceUtils");
const resourceWalkthrough_1 = require("./resourceWalkthrough");
const resourceParams_1 = require("../service-utils/resourceParams");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const geofencingServiceFriendlyName = (0, resourceWalkthrough_1.getServiceFriendlyName)(constants_1.ServiceName.GeofenceCollection);
const createGeofenceCollectionWalkthrough = async (context, parameters) => {
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.geofenceCollectionNameWalkthrough)());
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, exports.geofenceCollectionAccessWalkthrough)(context, parameters));
    const currentGeofenceCollectionResources = await (0, resourceUtils_2.getGeoServiceMeta)(constants_1.ServiceName.GeofenceCollection);
    if (currentGeofenceCollectionResources && Object.keys(currentGeofenceCollectionResources).length > 0) {
        parameters.isDefault = await amplify_prompts_1.prompter.yesOrNo((0, resourceWalkthrough_1.defaultResourceQuestion)(constants_1.ServiceName.GeofenceCollection), true);
    }
    else {
        parameters.isDefault = true;
    }
    return parameters;
};
exports.createGeofenceCollectionWalkthrough = createGeofenceCollectionWalkthrough;
const geofenceCollectionNameWalkthrough = async () => {
    const [shortId] = (0, uuid_1.v4)().split('-');
    const nameValidationErrMsg = 'Geofence Collection name can only use the following characters: a-z 0-9 and should have minimum 1 character and max of 95 characters';
    const uniquenessValidation = async (input) => (await (0, resourceUtils_2.checkGeoResourceExists)(input)) ? `Geo resource ${input} already exists. Choose another name.` : true;
    const validator = (0, amplify_prompts_1.and)([
        (0, amplify_prompts_1.alphanumeric)(nameValidationErrMsg),
        (0, amplify_prompts_1.minLength)(1, nameValidationErrMsg),
        (0, amplify_prompts_1.maxLength)(95, nameValidationErrMsg),
        uniquenessValidation,
    ]);
    const collectionNameInput = await amplify_prompts_1.prompter.input('Provide a name for the Geofence Collection:', {
        validate: validator,
        initial: `geofenceCollection${shortId}`,
    });
    return { name: collectionNameInput };
};
exports.geofenceCollectionNameWalkthrough = geofenceCollectionNameWalkthrough;
const geofenceCollectionAccessWalkthrough = async (context, parameters) => {
    var _a;
    parameters.accessType = resourceParams_1.AccessType.CognitoGroups;
    let userPoolGroupList = context.amplify.getUserPoolGroupList();
    if (userPoolGroupList.length <= 0) {
        if (await amplify_prompts_1.prompter.yesOrNo('Geofencing requires a Cognito user group for Admin only access control settings. Do you want to add it now?')) {
            amplify_prompts_1.printer.info('Select "Create or update Cognito user pool groups" to add a Cognito user group');
            const currentCommand = context.input['command'];
            context.input['command'] = 'update';
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'executeAmplifyCommand', [context]);
            userPoolGroupList = context.amplify.getUserPoolGroupList();
            context.input['command'] = currentCommand;
        }
        else {
            amplify_prompts_1.printer.error('No Cognito groups exist in the project. Please add a Cognito group using "amplify update auth" and selecting "Create or update Cognito user pool groups"');
            throw new Error('Failed to setup a Geofence Collection. Requires a Cognito group for Admin only access control settings');
        }
    }
    let defaultSelectedGroups = [];
    if (parameters.groupPermissions) {
        defaultSelectedGroups = Object.keys(parameters.groupPermissions);
    }
    if (defaultSelectedGroups.length === 0 && userPoolGroupList.length === 1) {
        defaultSelectedGroups.push(userPoolGroupList[0]);
    }
    const selectedUserPoolGroups = await amplify_prompts_1.prompter.pick('Select one or more cognito groups to give access:', userPoolGroupList, { returnSize: 'many', initial: (0, amplify_prompts_1.byValues)(defaultSelectedGroups), pickAtLeast: 1 });
    const groupCrudPermissionsFlow = async (group, defaults = []) => {
        const selectedCrudPermissions = await amplify_prompts_1.prompter.pick(`What kind of access do you want for ${group} users? Select ALL that apply:`, Object.keys(geofenceCollectionUtils_1.crudPermissionsMap), { returnSize: 'many', initial: (0, amplify_prompts_1.byValues)(defaults), pickAtLeast: 1 });
        return selectedCrudPermissions;
    };
    const selectedGroupPermissions = {};
    for (const selectedUserPoolGroup of selectedUserPoolGroups) {
        const defaults = ((_a = parameters === null || parameters === void 0 ? void 0 : parameters.groupPermissions) === null || _a === void 0 ? void 0 : _a[selectedUserPoolGroup]) || [];
        const selectedCrudPermissions = await groupCrudPermissionsFlow(selectedUserPoolGroup, defaults);
        selectedGroupPermissions[selectedUserPoolGroup] = selectedCrudPermissions;
    }
    parameters.groupPermissions = selectedGroupPermissions;
    return parameters;
};
exports.geofenceCollectionAccessWalkthrough = geofenceCollectionAccessWalkthrough;
const updateGeofenceCollectionWalkthrough = async (context, parameters, resourceToUpdate) => {
    const collectionResourceNames = await (0, resourceUtils_2.getGeoResources)(constants_1.ServiceName.GeofenceCollection);
    if (collectionResourceNames.length === 0) {
        amplify_prompts_1.printer.error(`No ${geofencingServiceFriendlyName} resource to update. Use "amplify add geo" to create a new ${geofencingServiceFriendlyName}.`);
        return parameters;
    }
    if (resourceToUpdate) {
        if (!collectionResourceNames.includes(resourceToUpdate)) {
            amplify_prompts_1.printer.error(`No ${geofencingServiceFriendlyName} named ${resourceToUpdate} exists in the project.`);
            return parameters;
        }
    }
    else {
        resourceToUpdate = await amplify_prompts_1.prompter.pick(`Select the ${geofencingServiceFriendlyName} you want to update`, collectionResourceNames);
    }
    parameters.name = resourceToUpdate;
    parameters = (0, resourceUtils_1.merge)(parameters, await (0, geofenceCollectionUtils_1.getCurrentGeofenceCollectionParameters)(resourceToUpdate));
    parameters.groupPermissions = (await (0, exports.geofenceCollectionAccessWalkthrough)(context, parameters)).groupPermissions;
    const otherCollectionResources = collectionResourceNames.filter((collectionResourceName) => collectionResourceName != resourceToUpdate);
    if (otherCollectionResources.length > 0) {
        const isDefault = await amplify_prompts_1.prompter.yesOrNo((0, resourceWalkthrough_1.defaultResourceQuestion)(constants_1.ServiceName.GeofenceCollection), parameters.isDefault);
        if (parameters.isDefault && !isDefault) {
            await (0, exports.updateDefaultGeofenceCollectionWalkthrough)(context, resourceToUpdate, otherCollectionResources);
        }
        parameters.isDefault = isDefault;
    }
    else {
        parameters.isDefault = true;
    }
    return parameters;
};
exports.updateGeofenceCollectionWalkthrough = updateGeofenceCollectionWalkthrough;
const updateDefaultGeofenceCollectionWalkthrough = async (context, currentDefault, availableGeofenceCollections) => {
    if (!availableGeofenceCollections) {
        availableGeofenceCollections = await (0, resourceUtils_2.getGeoResources)(constants_1.ServiceName.GeofenceCollection);
    }
    const otherCollectionResources = availableGeofenceCollections.filter((collectionResourceName) => collectionResourceName !== currentDefault);
    if ((otherCollectionResources === null || otherCollectionResources === void 0 ? void 0 : otherCollectionResources.length) > 0) {
        const defaultIndexName = await amplify_prompts_1.prompter.pick(`Select the ${geofencingServiceFriendlyName} you want to set as default:`, otherCollectionResources);
        await (0, resourceUtils_2.updateDefaultResource)(context, constants_1.ServiceName.GeofenceCollection, defaultIndexName);
    }
    return currentDefault;
};
exports.updateDefaultGeofenceCollectionWalkthrough = updateDefaultGeofenceCollectionWalkthrough;
//# sourceMappingURL=geofenceCollectionWalkthrough.js.map