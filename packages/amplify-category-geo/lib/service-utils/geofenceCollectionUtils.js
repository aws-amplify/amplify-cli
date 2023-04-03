"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crudPermissionsMap = exports.getGeofenceCollectionIamPolicies = exports.getCurrentGeofenceCollectionParameters = exports.constructGeofenceCollectionMetaParameters = exports.modifyGeofenceCollectionResource = exports.createGeofenceCollectionResource = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constants_1 = require("./constants");
const constants_2 = require("../constants");
const geofenceCollectionStack_1 = require("../service-stacks/geofenceCollectionStack");
const resourceUtils_1 = require("./resourceUtils");
const provider_controllers_1 = require("../provider-controllers");
const createGeofenceCollectionResource = async (context, parameters) => {
    const authResourceName = await (0, resourceUtils_1.getAuthResourceName)();
    const templateMappings = await (0, provider_controllers_1.getTemplateMappings)(context);
    const geofenceCollectionStack = new geofenceCollectionStack_1.GeofenceCollectionStack(new aws_cdk_lib_1.App(), 'GeofenceCollectionStack', {
        ...parameters,
        ...templateMappings,
        authResourceName,
    });
    (0, resourceUtils_1.generateTemplateFile)(geofenceCollectionStack, parameters.name);
    saveCFNParameters(parameters);
    amplify_cli_core_1.stateManager.setResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, parameters.name, {
        groupPermissions: parameters.groupPermissions,
    });
    const geofenceCollectionMetaParameters = (0, exports.constructGeofenceCollectionMetaParameters)(parameters, authResourceName);
    if (parameters.isDefault) {
        await (0, resourceUtils_1.updateDefaultResource)(context, constants_1.ServiceName.GeofenceCollection);
    }
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_2.category, parameters.name, geofenceCollectionMetaParameters);
    context.amplify.updateBackendConfigAfterResourceAdd(constants_2.category, parameters.name, geofenceCollectionMetaParameters);
};
exports.createGeofenceCollectionResource = createGeofenceCollectionResource;
const modifyGeofenceCollectionResource = async (context, parameters) => {
    const authResourceName = await (0, resourceUtils_1.getAuthResourceName)();
    const templateMappings = await (0, provider_controllers_1.getTemplateMappings)(context);
    const geofenceCollectionStack = new geofenceCollectionStack_1.GeofenceCollectionStack(new aws_cdk_lib_1.App(), 'GeofenceCollectionStack', {
        ...parameters,
        ...templateMappings,
        authResourceName,
    });
    (0, resourceUtils_1.generateTemplateFile)(geofenceCollectionStack, parameters.name);
    saveCFNParameters(parameters);
    amplify_cli_core_1.stateManager.setResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, parameters.name, {
        groupPermissions: parameters.groupPermissions,
    });
    if (parameters.isDefault) {
        await (0, resourceUtils_1.updateDefaultResource)(context, constants_1.ServiceName.GeofenceCollection, parameters.name);
    }
    const geofenceCollectionMetaParameters = (0, exports.constructGeofenceCollectionMetaParameters)(parameters, authResourceName);
    const paramsToUpdate = ['accessType', 'dependsOn'];
    paramsToUpdate.forEach((param) => {
        context.amplify.updateamplifyMetaAfterResourceUpdate(constants_2.category, parameters.name, param, geofenceCollectionMetaParameters[param]);
        context.amplify.updateBackendConfigAfterResourceUpdate(constants_2.category, parameters.name, param, geofenceCollectionMetaParameters[param]);
    });
};
exports.modifyGeofenceCollectionResource = modifyGeofenceCollectionResource;
const saveCFNParameters = (parameters) => {
    const params = {
        collectionName: parameters.name,
        isDefault: parameters.isDefault,
    };
    (0, resourceUtils_1.updateParametersFile)(params, parameters.name, constants_1.parametersFileName);
};
const constructGeofenceCollectionMetaParameters = (params, authResourceName) => {
    const dependsOnResources = (0, resourceUtils_1.getResourceDependencies)(Object.keys(params.groupPermissions), authResourceName);
    const result = {
        isDefault: params.isDefault,
        providerPlugin: constants_1.provider,
        service: constants_1.ServiceName.GeofenceCollection,
        accessType: params.accessType,
        dependsOn: dependsOnResources,
    };
    return result;
};
exports.constructGeofenceCollectionMetaParameters = constructGeofenceCollectionMetaParameters;
const getCurrentGeofenceCollectionParameters = async (collectionName) => {
    const currentCollectionMetaParameters = (await (0, resourceUtils_1.readResourceMetaParameters)(constants_1.ServiceName.GeofenceCollection, collectionName));
    const currentCollectionParameters = amplify_cli_core_1.stateManager.getResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, collectionName, { throwIfNotExist: false }) || {};
    return {
        accessType: currentCollectionMetaParameters.accessType,
        isDefault: currentCollectionMetaParameters.isDefault,
        groupPermissions: (currentCollectionParameters === null || currentCollectionParameters === void 0 ? void 0 : currentCollectionParameters.groupPermissions) || {},
    };
};
exports.getCurrentGeofenceCollectionParameters = getCurrentGeofenceCollectionParameters;
const getGeofenceCollectionIamPolicies = (resourceName, crudOptions) => {
    const policy = [];
    const actions = new Set();
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.add('geo:CreateGeofenceCollection');
                break;
            case 'read':
                actions.add('geo:DescribeGeofenceCollection');
                break;
            case 'delete':
                actions.add('geo:DeleteGeofenceCollection');
                break;
            default:
                break;
        }
    });
    const geofenceCollectionPolicy = {
        Effect: 'Allow',
        Action: Array.from(actions),
        Resource: [
            {
                'Fn::Join': [
                    '',
                    [
                        'arn:aws:geo:',
                        { Ref: 'AWS::Region' },
                        ':',
                        { Ref: 'AWS::AccountId' },
                        ':geofence-collection/',
                        {
                            Ref: `${constants_2.category}${resourceName}Name`,
                        },
                    ],
                ],
            },
        ],
    };
    policy.push(geofenceCollectionPolicy);
    const attributes = ['Name'];
    return { policy, attributes };
};
exports.getGeofenceCollectionIamPolicies = getGeofenceCollectionIamPolicies;
exports.crudPermissionsMap = {
    'Read geofence': ['geo:GetGeofence'],
    'Create/Update geofence': ['geo:PutGeofence', 'geo:BatchPutGeofence'],
    'Delete geofence': ['geo:BatchDeleteGeofence'],
    'List geofences': ['geo:ListGeofences'],
};
//# sourceMappingURL=geofenceCollectionUtils.js.map