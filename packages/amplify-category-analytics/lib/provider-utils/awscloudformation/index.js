"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionPolicies = exports.updateResource = exports.addResource = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const addResource = (context, __, service) => {
    const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
    const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { addWalkthrough } = require(serviceWalkthroughSrc);
    return addWalkthrough(context, defaultValuesFilename, serviceMetadata);
};
exports.addResource = addResource;
const updateResource = (context, __, service) => {
    const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
    const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { updateWalkthrough } = require(serviceWalkthroughSrc);
    if (!updateWalkthrough) {
        const message = 'Update functionality not available for this service';
        amplify_prompts_1.printer.error(message);
        void context.usageData.emitError(new amplify_cli_core_1.NotImplementedError(message));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    return updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
};
exports.updateResource = updateResource;
const getPermissionPolicies = (context, service, resourceName, crudOptions) => {
    const serviceMetadata = context.amplify.readJsonFile(`${__dirname}/../supported-services.json`)[service];
    const { serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
    const { getIAMPolicies } = require(serviceWalkthroughSrc);
    return getIAMPolicies(resourceName, crudOptions);
};
exports.getPermissionPolicies = getPermissionPolicies;
//# sourceMappingURL=index.js.map