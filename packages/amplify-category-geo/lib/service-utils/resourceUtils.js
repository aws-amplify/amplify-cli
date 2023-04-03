"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeoResources = exports.getResourceDependencies = exports.getAuthResourceName = exports.checkAnyGeoResourceExists = exports.getServicePermissionPolicies = exports.checkGeoResourceExists = exports.checkAuthConfig = exports.geoServiceExists = exports.updateDefaultResource = exports.readResourceMetaParameters = exports.getGeoServiceMeta = exports.updateParametersFile = exports.generateTemplateFile = exports.merge = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const constants_1 = require("../constants");
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const constants_2 = require("./constants");
const resourceParams_1 = require("./resourceParams");
const os_1 = __importDefault(require("os"));
const mapUtils_1 = require("./mapUtils");
const placeIndexUtils_1 = require("./placeIndexUtils");
const geofenceCollectionUtils_1 = require("./geofenceCollectionUtils");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
function merge(existing, other) {
    const mergeFunc = (oldVal, newVal) => {
        if (!lodash_1.default.isObject(oldVal)) {
            return oldVal;
        }
        if (lodash_1.default.isArray(oldVal)) {
            return lodash_1.default.uniqWith(oldVal.concat(newVal), lodash_1.default.isEqual);
        }
        return undefined;
    };
    if (!other)
        return existing;
    return lodash_1.default.mergeWith(existing, other, mergeFunc);
}
exports.merge = merge;
const generateTemplateFile = (stack, resourceName) => {
    const cfnFileName = `${resourceName}-cloudformation-template.json`;
    const resourceDir = path_1.default.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.category, resourceName);
    amplify_cli_core_1.JSONUtilities.writeJson(path_1.default.normalize(path_1.default.join(resourceDir, cfnFileName)), stack.toCloudFormation());
};
exports.generateTemplateFile = generateTemplateFile;
const updateParametersFile = (parameters, resourceName, parametersFileName) => {
    const parametersFilePath = path_1.default.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.category, resourceName, parametersFileName);
    const currentParameters = amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
    amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
};
exports.updateParametersFile = updateParametersFile;
const getGeoServiceMeta = async (service) => { var _a; return lodash_1.default.pickBy((_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a[constants_1.category], (val) => val.service === service); };
exports.getGeoServiceMeta = getGeoServiceMeta;
const readResourceMetaParameters = async (service, resourceName) => {
    const serviceResources = await (0, exports.getGeoServiceMeta)(service);
    const resourceMetaParameters = serviceResources === null || serviceResources === void 0 ? void 0 : serviceResources[resourceName];
    if (!resourceMetaParameters) {
        throw new Error(`Error reading Meta Parameters for ${resourceName}`);
    }
    else
        return resourceMetaParameters;
};
exports.readResourceMetaParameters = readResourceMetaParameters;
const updateDefaultResource = async (context, service, defaultResource) => {
    const serviceResources = await (0, exports.getGeoServiceMeta)(service);
    Object.keys(serviceResources).forEach((resource) => {
        context.amplify.updateamplifyMetaAfterResourceUpdate(constants_1.category, resource, 'isDefault', defaultResource === resource);
        context.amplify.updateBackendConfigAfterResourceUpdate(constants_1.category, resource, 'isDefault', defaultResource === resource);
        (0, exports.updateParametersFile)({ isDefault: defaultResource === resource }, resource, constants_2.parametersFileName);
    });
};
exports.updateDefaultResource = updateDefaultResource;
const geoServiceExists = async (service) => {
    const serviceMeta = await (0, exports.getGeoServiceMeta)(service);
    return serviceMeta && Object.keys(serviceMeta).length > 0;
};
exports.geoServiceExists = geoServiceExists;
const checkAuthConfig = async (context, parameters, service) => {
    if (parameters.accessType === resourceParams_1.AccessType.AuthorizedAndGuestUsers) {
        const authRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
        const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
            authRequirements,
            context,
            constants_1.category,
            parameters.name,
        ]);
        if (!checkResult.authEnabled) {
            throw new Error(`Adding ${service} to your project requires the Auth category for managing authentication rules. Please add auth using "amplify add auth"`);
        }
        if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
            throw new Error(checkResult.errors.join(os_1.default.EOL));
        }
        if (checkResult.errors && checkResult.errors.length > 0) {
            amplify_prompts_1.printer.warn(checkResult.errors.join(os_1.default.EOL));
        }
        if (!checkResult.requirementsMet) {
            try {
                await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                    context,
                    constants_1.category,
                    service,
                    authRequirements,
                ]);
            }
            catch (error) {
                amplify_prompts_1.printer.error(error);
                throw error;
            }
        }
    }
};
exports.checkAuthConfig = checkAuthConfig;
const checkGeoResourceExists = async (resourceName) => {
    var _a;
    const geoMeta = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a[constants_1.category];
    return geoMeta && Object.keys(geoMeta) && Object.keys(geoMeta).includes(resourceName);
};
exports.checkGeoResourceExists = checkGeoResourceExists;
const getServicePermissionPolicies = (context, service, resourceName, crudOptions) => {
    switch (service) {
        case constants_2.ServiceName.Map:
            return (0, mapUtils_1.getMapIamPolicies)(resourceName, crudOptions);
        case constants_2.ServiceName.PlaceIndex:
            return (0, placeIndexUtils_1.getPlaceIndexIamPolicies)(resourceName, crudOptions);
        case constants_2.ServiceName.GeofenceCollection:
            return (0, geofenceCollectionUtils_1.getGeofenceCollectionIamPolicies)(resourceName, crudOptions);
        default:
            amplify_prompts_1.printer.warn(`${service} not supported in category ${constants_1.category}`);
    }
    return { policy: [], attributes: [] };
};
exports.getServicePermissionPolicies = getServicePermissionPolicies;
const checkAnyGeoResourceExists = async () => {
    var _a;
    const geoMeta = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a[constants_1.category];
    return geoMeta && Object.keys(geoMeta) && Object.keys(geoMeta).length > 0;
};
exports.checkAnyGeoResourceExists = checkAnyGeoResourceExists;
const getAuthResourceName = async () => {
    var _a;
    const authMeta = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a[constants_1.authCategoryName];
    const cognitoResources = authMeta ? Object.keys(authMeta).filter((authResource) => authMeta[authResource].service === 'Cognito') : [];
    if (cognitoResources.length === 0) {
        throw new Error('No auth resource found. Run "amplify add auth"');
    }
    return cognitoResources[0];
};
exports.getAuthResourceName = getAuthResourceName;
const getResourceDependencies = (groupNames, authResourceName) => {
    const dependsOnResources = [
        {
            category: constants_1.authCategoryName,
            resourceName: authResourceName,
            attributes: ['UserPoolId'],
        },
    ];
    if (groupNames && groupNames.length > 0) {
        dependsOnResources.push({
            category: constants_1.authCategoryName,
            resourceName: 'userPoolGroups',
            attributes: groupNames.map((group) => `${group}GroupRole`),
        });
    }
    return dependsOnResources;
};
exports.getResourceDependencies = getResourceDependencies;
const getGeoResources = async (service) => {
    const serviceMeta = await (0, exports.getGeoServiceMeta)(service);
    return serviceMeta ? Object.keys(serviceMeta) : [];
};
exports.getGeoResources = getGeoResources;
//# sourceMappingURL=resourceUtils.js.map