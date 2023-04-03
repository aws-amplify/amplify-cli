"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapIamPolicies = exports.getMapFriendlyNames = exports.getCurrentMapParameters = exports.constructMapMetaParameters = exports.modifyMapResource = exports.createMapResource = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const mapParams_1 = require("./mapParams");
const constants_1 = require("./constants");
const constants_2 = require("../constants");
const mapStack_1 = require("../service-stacks/mapStack");
const resourceUtils_1 = require("./resourceUtils");
const provider_controllers_1 = require("../provider-controllers");
const createMapResource = async (context, parameters) => {
    await (0, resourceUtils_1.checkAuthConfig)(context, parameters, constants_1.ServiceName.Map);
    const authResourceName = await (0, resourceUtils_1.getAuthResourceName)();
    const templateMappings = await (0, provider_controllers_1.getTemplateMappings)(context);
    const mapStack = new mapStack_1.MapStack(new aws_cdk_lib_1.App(), 'MapStack', { ...parameters, ...templateMappings, authResourceName });
    (0, resourceUtils_1.generateTemplateFile)(mapStack, parameters.name);
    saveCFNParameters(parameters);
    amplify_cli_core_1.stateManager.setResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, parameters.name, {
        groupPermissions: parameters.groupPermissions,
    });
    const mapMetaParameters = (0, exports.constructMapMetaParameters)(parameters, authResourceName);
    if (parameters.isDefault) {
        await (0, resourceUtils_1.updateDefaultResource)(context, constants_1.ServiceName.Map);
    }
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_2.category, parameters.name, mapMetaParameters);
};
exports.createMapResource = createMapResource;
const modifyMapResource = async (context, parameters) => {
    await (0, resourceUtils_1.checkAuthConfig)(context, parameters, constants_1.ServiceName.Map);
    const authResourceName = await (0, resourceUtils_1.getAuthResourceName)();
    const templateMappings = await (0, provider_controllers_1.getTemplateMappings)(context);
    const mapStack = new mapStack_1.MapStack(new aws_cdk_lib_1.App(), 'MapStack', { ...parameters, ...templateMappings, authResourceName });
    (0, resourceUtils_1.generateTemplateFile)(mapStack, parameters.name);
    saveCFNParameters(parameters);
    amplify_cli_core_1.stateManager.setResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, parameters.name, {
        groupPermissions: parameters.groupPermissions,
    });
    if (parameters.isDefault) {
        await (0, resourceUtils_1.updateDefaultResource)(context, constants_1.ServiceName.Map, parameters.name);
    }
    const mapMetaParameters = (0, exports.constructMapMetaParameters)(parameters, authResourceName);
    const paramsToUpdate = ['accessType', 'dependsOn'];
    paramsToUpdate.forEach((param) => {
        context.amplify.updateamplifyMetaAfterResourceUpdate(constants_2.category, parameters.name, param, mapMetaParameters[param]);
        context.amplify.updateBackendConfigAfterResourceUpdate(constants_2.category, parameters.name, param, mapMetaParameters[param]);
    });
    context.amplify.updateamplifyMetaAfterResourceUpdate(constants_2.category, parameters.name, 'pricingPlan', undefined);
    context.amplify.updateBackendConfigAfterResourceUpdate(constants_2.category, parameters.name, 'pricingPlan', undefined);
};
exports.modifyMapResource = modifyMapResource;
const saveCFNParameters = (parameters) => {
    const params = {
        authRoleName: {
            Ref: 'AuthRoleName',
        },
        unauthRoleName: {
            Ref: 'UnauthRoleName',
        },
        mapName: parameters.name,
        mapStyle: (0, mapParams_1.getGeoMapStyle)(parameters.dataProvider, parameters.mapStyleType),
        isDefault: parameters.isDefault,
        pricingPlan: undefined,
    };
    (0, resourceUtils_1.updateParametersFile)(params, parameters.name, constants_1.parametersFileName);
};
const constructMapMetaParameters = (params, authResourceName) => {
    const dependsOnResources = (0, resourceUtils_1.getResourceDependencies)(params.groupPermissions, authResourceName);
    const result = {
        isDefault: params.isDefault,
        providerPlugin: constants_1.provider,
        service: constants_1.ServiceName.Map,
        mapStyle: (0, mapParams_1.getGeoMapStyle)(params.dataProvider, params.mapStyleType),
        accessType: params.accessType,
        dependsOn: dependsOnResources,
    };
    return result;
};
exports.constructMapMetaParameters = constructMapMetaParameters;
const getCurrentMapParameters = async (mapName) => {
    const currentMapMetaParameters = (await (0, resourceUtils_1.readResourceMetaParameters)(constants_1.ServiceName.Map, mapName));
    const currentMapParameters = amplify_cli_core_1.stateManager.getResourceInputsJson(amplify_cli_core_1.pathManager.findProjectRoot(), constants_2.category, mapName, { throwIfNotExist: false }) || {};
    return {
        mapStyleType: (0, mapParams_1.getMapStyleComponents)(currentMapMetaParameters.mapStyle).mapStyleType,
        dataProvider: (0, mapParams_1.getMapStyleComponents)(currentMapMetaParameters.mapStyle).dataProvider,
        accessType: currentMapMetaParameters.accessType,
        isDefault: currentMapMetaParameters.isDefault,
        groupPermissions: (currentMapParameters === null || currentMapParameters === void 0 ? void 0 : currentMapParameters.groupPermissions) || [],
    };
};
exports.getCurrentMapParameters = getCurrentMapParameters;
const getMapFriendlyNames = async (mapNames) => {
    const currentMapResources = await (0, resourceUtils_1.getGeoServiceMeta)(constants_1.ServiceName.Map);
    return mapNames.map((mapName) => {
        var _a;
        const mapStyle = (_a = currentMapResources === null || currentMapResources === void 0 ? void 0 : currentMapResources[mapName]) === null || _a === void 0 ? void 0 : _a.mapStyle;
        return mapStyle ? `${mapName} (${mapStyle})` : mapName;
    });
};
exports.getMapFriendlyNames = getMapFriendlyNames;
const getMapIamPolicies = (resourceName, crudOptions) => {
    const policy = [];
    const actions = new Set();
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case 'create':
                actions.add('geo:CreateMap');
                break;
            case 'read':
                actions.add('geo:DescribeMap');
                actions.add('geo:GetMapGlyphs');
                actions.add('geo:GetMapSprites');
                actions.add('geo:GetMapStyleDescriptor');
                actions.add('geo:GetMapTile');
                break;
            case 'delete':
                actions.add('geo:DeleteMap');
                break;
            default:
                break;
        }
    });
    const mapPolicy = {
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
                        ':map/',
                        {
                            Ref: `${constants_2.category}${resourceName}Name`,
                        },
                    ],
                ],
            },
        ],
    };
    policy.push(mapPolicy);
    const attributes = ['Name'];
    return { policy, attributes };
};
exports.getMapIamPolicies = getMapIamPolicies;
//# sourceMappingURL=mapUtils.js.map