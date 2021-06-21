"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openConsole = exports.addMapResource = exports.addResource = void 0;
const mapParams_1 = require("./utils/mapParams");
const resourceParamsUtils_1 = require("./utils/resourceParamsUtils");
const supportedServices_1 = require("../supportedServices");
const constants_1 = require("./utils/constants");
const amplify_cli_core_1 = require("amplify-cli-core");
const createMapResource_1 = require("./utils/createMapResource");
async function addResource(context, category, service, parameters) {
    const BAD_SERVICE_ERR = new Error(`amplify-category-geo is not configured to provide service type ${service}`);
    while (!checkIfAuthExists(context)) {
        if (await context.amplify.confirmPrompt('You need to add auth (Amazon Cognito) to your project in order to add geo resources. Do you want to add auth now?')) {
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
            break;
        }
        else {
            context.usageData.emitSuccess();
            amplify_cli_core_1.exitOnNextTick(0);
        }
    }
    switch (service) {
        case "Map":
            const serviceConfig = supportedServices_1.supportedServices[service];
            return addMapResource(context, service, serviceConfig, parameters);
        default:
            throw BAD_SERVICE_ERR;
    }
}
exports.addResource = addResource;
function checkIfAuthExists(context) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    let authExists = false;
    const authServiceName = 'Cognito';
    const authCategory = 'auth';
    if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
        const categoryResources = amplifyMeta[authCategory];
        Object.keys(categoryResources).forEach(resource => {
            if (categoryResources[resource].service === authServiceName) {
                authExists = true;
            }
        });
    }
    return authExists;
}
async function addMapResource(context, service, serviceConfig, parameters) {
    let completeParams;
    if (!parameters || !mapParams_1.isCompleteMapParams(parameters)) {
        let mapParams = {
            providerContext: {
                provider: constants_1.provider,
                service: service,
                projectName: context.amplify.getProjectDetails().projectConfig.projectName,
            },
        };
        mapParams = resourceParamsUtils_1.merge(mapParams, parameters);
        await serviceConfig.walkthroughs.createWalkthrough(context, mapParams);
        completeParams = mapParams_1.convertToCompleteMapParams(mapParams);
    }
    else {
        completeParams = parameters;
    }
    createMapResource_1.createMapResource(context, completeParams);
    const { print } = context;
    print.success(`Successfully added resource ${completeParams.mapName} locally.`);
    print.info('');
    print.success('Next steps:');
    print.info(`Check out sample function code generated in <project-dir>/amplify/backend/function/${completeParams.mapName}/src`);
    print.info('"amplify function build" builds all of your functions currently in the project');
    print.info('"amplify mock function <functionName>" runs your function locally');
    print.info('"amplify push" builds all of your local backend resources and provisions them in the cloud');
    print.info('"amplify publish" builds all of your local backend and front-end resources (if you added hosting category) and provisions them in the cloud');
    return completeParams.mapName;
}
exports.addMapResource = addMapResource;
function openConsole(context, service) {
    const amplifyMeta = context.amplify.getProjectMeta();
    const region = amplifyMeta.providers[constants_1.provider].Region;
    let selection;
    switch (service) {
        case "Map":
            selection = "maps";
        default:
            selection = undefined;
    }
    let url = `https://${region}.console.aws.amazon.com/location/home?region=${region}#/`;
    if (selection) {
        url = `https://${region}.console.aws.amazon.com/location/${selection}/home?region=${region}#/`;
    }
    amplify_cli_core_1.open(url, { wait: false });
}
exports.openConsole = openConsole;
//# sourceMappingURL=index.js.map