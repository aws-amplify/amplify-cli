"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printErrorAuthResourceMigrationFailed = exports.printErrorAlreadyCreated = exports.printErrorNoResourcesToUpdate = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
async function printErrorNoResourcesToUpdate(context) {
    const errMessage = 'No resources to update. You need to add a resource.';
    amplify_prompts_1.printer.error(errMessage);
    await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
}
exports.printErrorNoResourcesToUpdate = printErrorNoResourcesToUpdate;
async function printErrorAlreadyCreated(context) {
    const errMessage = 'Amazon S3 storage was already added to your project.';
    amplify_prompts_1.printer.warn(errMessage);
    await context.usageData.emitError(new amplify_cli_core_1.ResourceAlreadyExistsError(errMessage));
}
exports.printErrorAlreadyCreated = printErrorAlreadyCreated;
async function printErrorAuthResourceMigrationFailed(context) {
    const errMessage = 'Auth migration has failed';
    amplify_prompts_1.printer.warn(errMessage);
    await context.usageData.emitError(new amplify_cli_core_1.ConfigurationError(errMessage));
}
exports.printErrorAuthResourceMigrationFailed = printErrorAuthResourceMigrationFailed;
//# sourceMappingURL=s3-errors.js.map