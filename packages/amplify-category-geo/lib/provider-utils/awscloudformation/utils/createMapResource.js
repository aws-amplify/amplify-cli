"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMapResource = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const mapParams_1 = require("./mapParams");
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants");
const constants_2 = require("../../../constants");
const mapStack_1 = require("../service-stacks/mapStack");
function createMapResource(context, parameters) {
    generateTemplateFile(parameters);
    saveCFNParameters(parameters);
    context.amplify.updateamplifyMetaAfterResourceAdd(constants_2.category, parameters.mapName, updateAmplifyMeta(context, parameters));
}
exports.createMapResource = createMapResource;
function saveCFNParameters(parameters) {
    const params = {
        authRoleName: {
            "Ref": "AuthRoleName"
        },
        unauthRoleName: {
            "Ref": "UnauthRoleName"
        }
    };
    createParametersFile(params, parameters.mapName, constants_1.parametersFileName);
}
function generateTemplateFile(parameters) {
    const mapStack = new mapStack_1.MapStack(undefined, 'MapStack', parameters);
    const cfnFileName = (resourceName) => `${resourceName}-cloudformation-template.json`;
    const resourceDir = path_1.default.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_2.category, parameters.mapName);
    amplify_cli_core_1.JSONUtilities.writeJson(path_1.default.normalize(path_1.default.join(resourceDir, cfnFileName(parameters.mapName))), mapStack.toCloudFormation());
}
function createParametersFile(parameters, resourceName, parametersFileName) {
    const parametersFilePath = path_1.default.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_2.category, resourceName, parametersFileName);
    const currentParameters = amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath, { throwIfNotExist: false }) || {};
    amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, { ...currentParameters, ...parameters });
}
function updateAmplifyMeta(context, params) {
    let result = {
        isDefaultMap: params.isDefaultMap,
        providerPlugin: constants_1.provider,
        service: "Map",
        mapStyle: mapParams_1.getGeoMapStyle(params.dataProvider, params.mapStyleType)
    };
    if (params.isDefaultMap) {
        updateDefaultMap(context);
    }
    return result;
}
function updateDefaultMap(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    if (amplifyMeta[constants_2.category]) {
        const categoryResources = amplifyMeta[constants_2.category];
        Object.keys(categoryResources).forEach(resource => {
            if (categoryResources[resource].service === "Map" && categoryResources[resource].isDefaultMap) {
                amplify.updateamplifyMetaAfterResourceUpdate(constants_2.category, resource, 'isDefaultMap', false);
            }
        });
    }
}
//# sourceMappingURL=createMapResource.js.map