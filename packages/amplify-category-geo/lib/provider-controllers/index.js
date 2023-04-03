"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateResourceHeadless = exports.addResourceHeadless = exports.getTemplateMappings = exports.insufficientInfoForUpdateError = exports.openConsole = exports.setProviderContext = exports.printNextStepsSuccessMessage = exports.projectHasAuth = exports.removeResource = exports.updateResource = exports.addResource = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_util_headless_input_1 = require("amplify-util-headless-input");
const constants_1 = require("../service-utils/constants");
const resourceUtils_1 = require("../service-utils/resourceUtils");
const resourceWalkthrough_1 = require("../service-walkthroughs/resourceWalkthrough");
const geofenceCollection_1 = require("./geofenceCollection");
const map_1 = require("./map");
const placeIndex_1 = require("./placeIndex");
const addResource = async (context, service) => {
    if (!(0, exports.projectHasAuth)()) {
        if (await amplify_prompts_1.prompter.yesOrNo('geo category resources require auth (Amazon Cognito). Do you want to add auth now?')) {
            await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.AUTH, undefined, 'add', [context]);
        }
        else {
            amplify_prompts_1.printer.info('Please add auth (Amazon Cognito) to your project using "amplify add auth"');
            return undefined;
        }
    }
    switch (service) {
        case constants_1.ServiceName.Map:
            return (0, map_1.addMapResource)(context);
        case constants_1.ServiceName.PlaceIndex:
            return (0, placeIndex_1.addPlaceIndexResource)(context);
        case constants_1.ServiceName.GeofenceCollection:
            return (0, geofenceCollection_1.addGeofenceCollectionResource)(context);
        default:
            throw badServiceError(service);
    }
};
exports.addResource = addResource;
const updateResource = async (context, service) => {
    switch (service) {
        case constants_1.ServiceName.Map:
            return (0, map_1.updateMapResource)(context);
        case constants_1.ServiceName.PlaceIndex:
            return (0, placeIndex_1.updatePlaceIndexResource)(context);
        case constants_1.ServiceName.GeofenceCollection:
            return (0, geofenceCollection_1.updateGeofenceCollectionResource)(context);
        default:
            throw badServiceError(service);
    }
};
exports.updateResource = updateResource;
const removeResource = async (context, service) => {
    switch (service) {
        case constants_1.ServiceName.Map:
            return (0, map_1.removeMapResource)(context);
        case constants_1.ServiceName.PlaceIndex:
            return (0, placeIndex_1.removePlaceIndexResource)(context);
        case constants_1.ServiceName.GeofenceCollection:
            return (0, geofenceCollection_1.removeGeofenceCollectionResource)(context);
        default:
            throw badServiceError(service);
    }
};
exports.removeResource = removeResource;
const projectHasAuth = () => { var _a; return !!Object.values(((_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.auth) || {}).find((meta) => (meta === null || meta === void 0 ? void 0 : meta.service) === amplify_cli_core_1.AmplifySupportedService.COGNITO); };
exports.projectHasAuth = projectHasAuth;
const printNextStepsSuccessMessage = () => {
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.success('Next steps:');
    amplify_prompts_1.printer.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
    amplify_prompts_1.printer.info('"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud');
};
exports.printNextStepsSuccessMessage = printNextStepsSuccessMessage;
const setProviderContext = (context, service) => ({
    provider: constants_1.provider,
    service,
    projectName: context.amplify.getProjectDetails().projectConfig.projectName,
});
exports.setProviderContext = setProviderContext;
const openConsole = async (service) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const region = amplifyMeta.providers[constants_1.provider].Region;
    let selection;
    switch (service) {
        case constants_1.ServiceName.Map:
            selection = 'maps';
            break;
        case constants_1.ServiceName.PlaceIndex:
            selection = 'places';
            break;
        case constants_1.ServiceName.GeofenceCollection:
            selection = 'geofencing';
            break;
        default:
            selection = undefined;
    }
    let url = `https://${region}.console.aws.amazon.com/location/home?region=${region}#/`;
    if (selection) {
        url = `https://${region}.console.aws.amazon.com/location/${selection}/home?region=${region}#/`;
    }
    await (0, amplify_cli_core_1.open)(url, { wait: false });
};
exports.openConsole = openConsole;
const badServiceError = (service) => new Error(`amplify-category-geo is not configured to provide service type ${service}`);
const insufficientInfoForUpdateError = (service) => new Error(`Insufficient information to update ${(0, resourceWalkthrough_1.getServiceFriendlyName)(service)}. Please re-try and provide all inputs.`);
exports.insufficientInfoForUpdateError = insufficientInfoForUpdateError;
const getTemplateMappings = async (context) => {
    var _a;
    const Mappings = {
        RegionMapping: {},
    };
    const providerPlugins = context.amplify.getProviderPlugins(context);
    const providerPlugin = await (_a = providerPlugins[constants_1.provider], Promise.resolve().then(() => __importStar(require(_a))));
    const regionMapping = providerPlugin.getLocationRegionMapping();
    Object.keys(regionMapping).forEach((region) => {
        Mappings.RegionMapping[region] = {
            locationServiceRegion: regionMapping[region],
        };
    });
    return Mappings;
};
exports.getTemplateMappings = getTemplateMappings;
const addResourceHeadless = async (context, headlessPayload) => {
    if (!(0, exports.projectHasAuth)()) {
        throw new Error('Please add auth (Amazon Cognito) to your project using "amplify add auth"');
    }
    const { serviceConfiguration } = await (0, amplify_util_headless_input_1.validateAddGeoRequest)(headlessPayload);
    const { serviceName, name } = serviceConfiguration;
    if (await (0, resourceUtils_1.checkGeoResourceExists)(name)) {
        throw new Error(`Geo resource with name '${name}' already exists.`);
    }
    switch (serviceName) {
        case constants_1.ServiceName.Map:
            return (0, map_1.addMapResourceHeadless)(context, serviceConfiguration);
        default:
            throw badHeadlessServiceError(serviceName);
    }
};
exports.addResourceHeadless = addResourceHeadless;
const updateResourceHeadless = async (context, headlessPayload) => {
    const { serviceModification } = await (0, amplify_util_headless_input_1.validateUpdateGeoRequest)(headlessPayload);
    const { serviceName, name } = serviceModification;
    if (!(await (0, resourceUtils_1.checkGeoResourceExists)(name))) {
        throw new Error(`Geo resource with name '${name}' does not exist.`);
    }
    switch (serviceName) {
        case constants_1.ServiceName.Map:
            return (0, map_1.updateMapResourceHeadless)(context, serviceModification);
        default:
            throw badHeadlessServiceError(serviceName);
    }
};
exports.updateResourceHeadless = updateResourceHeadless;
const badHeadlessServiceError = (service) => new Error(`Headless mode for service type ${service} is not supported`);
//# sourceMappingURL=index.js.map