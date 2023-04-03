"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWalkthrough = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const resourceUtils_1 = require("../service-utils/resourceUtils");
const resourceWalkthrough_1 = require("./resourceWalkthrough");
const removeWalkthrough = async (service) => {
    const resources = await (0, resourceUtils_1.getGeoResources)(service);
    const serviceFriendlyName = (0, resourceWalkthrough_1.getServiceFriendlyName)(service);
    if (resources.length === 0) {
        amplify_prompts_1.printer.error(`No ${serviceFriendlyName} exists in the project.`);
        return undefined;
    }
    return amplify_prompts_1.prompter.pick(`Select the ${serviceFriendlyName} you want to remove`, resources);
};
exports.removeWalkthrough = removeWalkthrough;
//# sourceMappingURL=removeWalkthrough.js.map