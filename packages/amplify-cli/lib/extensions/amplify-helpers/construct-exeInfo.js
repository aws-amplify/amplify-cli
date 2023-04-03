"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructExeInfo = void 0;
const get_project_details_1 = require("./get-project-details");
const amplify_cli_core_1 = require("amplify-cli-core");
function constructExeInfo(context) {
    const projectDetails = (0, get_project_details_1.getProjectDetails)();
    context.exeInfo = { ...projectDetails, inputParams: {} };
    if (!context.parameters.options) {
        return;
    }
    Object.keys(context.parameters.options).forEach((key) => {
        const normalizedKey = normalizeKey(key);
        context.exeInfo.inputParams[normalizedKey] = amplify_cli_core_1.JSONUtilities.parse(context.parameters.options[key]);
    });
}
exports.constructExeInfo = constructExeInfo;
function normalizeKey(key) {
    if (key === 'y') {
        key = 'yes';
    }
    return key;
}
//# sourceMappingURL=construct-exeInfo.js.map