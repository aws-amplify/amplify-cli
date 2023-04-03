"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultResourceQuestion = exports.getServiceFriendlyName = exports.dataProviderWalkthrough = exports.resourceAccessWalkthrough = void 0;
const resourceParams_1 = require("../service-utils/resourceParams");
const constants_1 = require("../service-utils/constants");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
async function resourceAccessWalkthrough(context, parameters, service) {
    let permissionSelected = 'Auth/Guest Users';
    const LearnMore = 'Learn more';
    const userPoolGroupList = context.amplify.getUserPoolGroupList();
    if (userPoolGroupList.length > 0) {
        let defaultPermission = 'Auth/Guest Users';
        if (parameters.accessType === resourceParams_1.AccessType.CognitoGroups) {
            defaultPermission = 'Individual Groups';
        }
        else if (parameters.groupPermissions &&
            parameters.groupPermissions.length > 0 &&
            parameters.accessType !== resourceParams_1.AccessType.CognitoGroups) {
            defaultPermission = 'Both';
        }
        do {
            if (permissionSelected === LearnMore) {
                amplify_prompts_1.printer.blankLine();
                amplify_prompts_1.printer.info("You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Groups in a User Pool. If a user logs into your application and is not a member of any group they will have the permissions set for “Authenticated Users”. However if they belong to a group they will ONLY get the policy associated with that specific group. They will NOT get the union of 'Authenticated Users' and that group's policy.");
                amplify_prompts_1.printer.blankLine();
            }
            permissionSelected = await amplify_prompts_1.prompter.pick(`Restrict access by?`, ['Auth/Guest Users', 'Individual Groups', 'Both', LearnMore], { initial: (0, amplify_prompts_1.byValue)(defaultPermission) });
        } while (permissionSelected === 'Learn more');
    }
    if (permissionSelected === 'Both' || permissionSelected === 'Auth/Guest Users') {
        const accessChoices = [
            { name: 'Authorized users only', value: resourceParams_1.AccessType.AuthorizedUsers },
            { name: 'Authorized and Guest users', value: resourceParams_1.AccessType.AuthorizedAndGuestUsers },
        ];
        let accessTypeDefaultIndex = 0;
        if (parameters.accessType === resourceParams_1.AccessType.AuthorizedAndGuestUsers) {
            accessTypeDefaultIndex = 1;
        }
        parameters.accessType = (await amplify_prompts_1.prompter.pick(`Who can access this ${(0, exports.getServiceFriendlyName)(service)}?`, accessChoices, {
            initial: accessTypeDefaultIndex,
        }));
        if (permissionSelected === 'Auth/Guest Users') {
            parameters.groupPermissions = [];
        }
    }
    if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
        let defaultSelectedGroups = [];
        if (parameters.groupPermissions) {
            defaultSelectedGroups = parameters.groupPermissions;
        }
        const selectedUserPoolGroups = await amplify_prompts_1.prompter.pick('Select one or more cognito groups to give access:', userPoolGroupList, { returnSize: 'many', initial: (0, amplify_prompts_1.byValues)(defaultSelectedGroups), pickAtLeast: 1 });
        parameters.groupPermissions = selectedUserPoolGroups;
        if (permissionSelected === 'Individual Groups') {
            parameters.accessType = resourceParams_1.AccessType.CognitoGroups;
        }
    }
    return parameters;
}
exports.resourceAccessWalkthrough = resourceAccessWalkthrough;
async function dataProviderWalkthrough(parameters, service) {
    let dataProviderPrompt = `Specify the data provider of geospatial data for this ${(0, exports.getServiceFriendlyName)(service)}:`;
    if (service === constants_1.ServiceName.GeofenceCollection) {
        dataProviderPrompt = `Specify the data provider for ${(0, exports.getServiceFriendlyName)(service)}. This will be only used to calculate billing.`;
    }
    const dataProviderInput = await amplify_prompts_1.prompter.pick(dataProviderPrompt, Object.values(resourceParams_1.DataProvider), {
        initial: parameters.dataProvider === resourceParams_1.DataProvider.Esri ? 0 : 1,
    });
    const provider = Object.keys(resourceParams_1.DataProvider).find((key) => resourceParams_1.DataProvider[key] === dataProviderInput);
    if (provider === resourceParams_1.DataProvider.Esri) {
        amplify_prompts_1.printer.warn(`${resourceParams_1.DataProvider.Esri} does not support tracking and routing commercial assets. Refer to ${constants_1.apiDocs.pricingPlan} `);
    }
    parameters.dataProvider = provider;
    return parameters;
}
exports.dataProviderWalkthrough = dataProviderWalkthrough;
const getServiceFriendlyName = (service) => {
    switch (service) {
        case constants_1.ServiceName.PlaceIndex:
            return 'search index';
        case constants_1.ServiceName.GeofenceCollection:
            return 'geofence collection';
        default:
            return service;
    }
};
exports.getServiceFriendlyName = getServiceFriendlyName;
const defaultResourceQuestion = (service) => {
    const friendlyServiceName = (0, exports.getServiceFriendlyName)(service);
    return `Set this ${friendlyServiceName} as the default? It will be used in Amplify ${friendlyServiceName} API calls if no explicit reference is provided.`;
};
exports.defaultResourceQuestion = defaultResourceQuestion;
//# sourceMappingURL=resourceWalkthrough.js.map