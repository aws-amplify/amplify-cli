"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaceIndexIamPolicies = exports.getCurrentPlaceIndexParameters = exports.constructPlaceIndexMetaParameters = exports.modifyPlaceIndexResource = exports.createPlaceIndexResource = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constants_1 = require("./constants");
const constants_2 = require("../constants");
const placeIndexStack_1 = require("../service-stacks/placeIndexStack");
const resourceUtils_1 = require("./resourceUtils");
const provider_controllers_1 = require("../provider-controllers");
const resourceParams_1 = require("./resourceParams");
const createPlaceIndexResource = async (context, parameters) => {
    await (0, resourceUtils_1.checkAuthConfig)(context, parameters, constants_1.ServiceName.PlaceIndex);
    const authResourceName = await (0, resourceUtils_1.getAuthResourceName)();
    const templateMappings = await (0, provider_controllers_1.getTemplateMappings)(context);
    const placeIndexStack = new placeIndexStack_1.PlaceIndexStack(new aws_cdk_lib_1.App(), 'PlaceIndexStack', { ...parameters, ...templateMappings, authResourceName });
    (0, resourceUtils_1.generateTemplateFile)(placeIndexStack, parameters.name);
    saveCFNParameters(parameters);
    amplify_cli_core_1.stateManager.setResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, parameters.name, {
        groupPermissions: parameters.groupPermissions,
    });
    const placeIndexMetaParameters = (0, exports.constructPlaceIndexMetaParameters)(parameters, authResourceName);
    if (parameters.isDefault) {
        await (0, resourceUtils_1.updateDefaultResource)(context, constants_1.ServiceName.PlaceIndex);
    }
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_2.category, parameters.name, placeIndexMetaParameters);
};
exports.createPlaceIndexResource = createPlaceIndexResource;
const modifyPlaceIndexResource = async (context, parameters) => {
    await (0, resourceUtils_1.checkAuthConfig)(context, parameters, constants_1.ServiceName.PlaceIndex);
    const authResourceName = await (0, resourceUtils_1.getAuthResourceName)();
    const templateMappings = await (0, provider_controllers_1.getTemplateMappings)(context);
    const placeIndexStack = new placeIndexStack_1.PlaceIndexStack(new aws_cdk_lib_1.App(), 'PlaceIndexStack', { ...parameters, ...templateMappings, authResourceName });
    (0, resourceUtils_1.generateTemplateFile)(placeIndexStack, parameters.name);
    saveCFNParameters(parameters);
    amplify_cli_core_1.stateManager.setResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, parameters.name, {
        groupPermissions: parameters.groupPermissions,
    });
    if (parameters.isDefault) {
        await (0, resourceUtils_1.updateDefaultResource)(context, constants_1.ServiceName.PlaceIndex, parameters.name);
    }
    const placeIndexMetaParameters = (0, exports.constructPlaceIndexMetaParameters)(parameters, authResourceName);
    const paramsToUpdate = ['accessType', 'dependsOn'];
    paramsToUpdate.forEach((param) => {
        context.amplify.updateamplifyMetaAfterResourceUpdate(constants_2.category, parameters.name, param, placeIndexMetaParameters[param]);
        context.amplify.updateBackendConfigAfterResourceUpdate(constants_2.category, parameters.name, param, placeIndexMetaParameters[param]);
    });
    context.amplify.updateamplifyMetaAfterResourceUpdate(constants_2.category, parameters.name, 'pricingPlan', undefined);
    context.amplify.updateBackendConfigAfterResourceUpdate(constants_2.category, parameters.name, 'pricingPlan', undefined);
};
exports.modifyPlaceIndexResource = modifyPlaceIndexResource;
const saveCFNParameters = (parameters) => {
    const params = {
        authRoleName: {
            Ref: 'AuthRoleName',
        },
        unauthRoleName: {
            Ref: 'UnauthRoleName',
        },
        indexName: parameters.name,
        dataProvider: parameters.dataProvider === resourceParams_1.DataProvider.Esri ? 'Esri' : 'Here',
        dataSourceIntendedUse: parameters.dataSourceIntendedUse,
        isDefault: parameters.isDefault,
        pricingPlan: undefined,
    };
    (0, resourceUtils_1.updateParametersFile)(params, parameters.name, constants_1.parametersFileName);
};
const constructPlaceIndexMetaParameters = (params, authResourceName) => {
    const dependsOnResources = (0, resourceUtils_1.getResourceDependencies)(params.groupPermissions, authResourceName);
    const result = {
        isDefault: params.isDefault,
        providerPlugin: constants_1.provider,
        service: constants_1.ServiceName.PlaceIndex,
        dataProvider: params.dataProvider,
        dataSourceIntendedUse: params.dataSourceIntendedUse,
        accessType: params.accessType,
        dependsOn: dependsOnResources,
    };
    return result;
};
exports.constructPlaceIndexMetaParameters = constructPlaceIndexMetaParameters;
const getCurrentPlaceIndexParameters = async (indexName) => {
    const currentIndexMetaParameters = (await (0, resourceUtils_1.readResourceMetaParameters)(constants_1.ServiceName.PlaceIndex, indexName));
    const currentIndexParameters = amplify_cli_core_1.stateManager.getResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, indexName, { throwIfNotExist: false }) || {};
    return {
        dataProvider: currentIndexMetaParameters.dataProvider,
        dataSourceIntendedUse: currentIndexMetaParameters.dataSourceIntendedUse,
        accessType: currentIndexMetaParameters.accessType,
        isDefault: currentIndexMetaParameters.isDefault,
        groupPermissions: (currentIndexParameters === null || currentIndexParameters === void 0 ? void 0 : currentIndexParameters.groupPermissions) || [],
    };
};
exports.getCurrentPlaceIndexParameters = getCurrentPlaceIndexParameters;
const getPlaceIndexIamPolicies = (resourceName, crudOptions) => {
    const policy = [];
    const actions = new Set();
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.add('geo:CreatePlaceIndex');
                break;
            case 'read':
                actions.add('geo:DescribePlaceIndex');
                actions.add('geo:SearchPlaceIndexForPosition');
                actions.add('geo:SearchPlaceIndexForText');
                actions.add('geo:SearchPlaceIndexForSuggestions');
                actions.add('geo:GetPlace');
                break;
            case 'delete':
                actions.add('geo:DeletePlaceIndex');
                break;
            default:
                break;
        }
    });
    const placeIndexPolicy = {
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
                        ':place-index/',
                        {
                            Ref: `${constants_2.category}${resourceName}Name`,
                        },
                    ],
                ],
            },
        ],
    };
    policy.push(placeIndexPolicy);
    const attributes = ['Name'];
    return { policy, attributes };
};
exports.getPlaceIndexIamPolicies = getPlaceIndexIamPolicies;
//# sourceMappingURL=placeIndexUtils.js.map