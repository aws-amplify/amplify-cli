"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const path_1 = __importDefault(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const check_for_auth_migration_1 = require("../../provider-utils/awscloudformation/utils/check-for-auth-migration");
const getAuthResourceName_1 = require("../../utils/getAuthResourceName");
const category = 'auth';
exports.name = 'overrides';
const run = async (context) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const authResources = [];
    Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        authResources.push(resourceName);
    });
    if (authResources.length === 0) {
        const errMessage = 'No auth resources to override. Add auth using `amplify add auth`';
        amplify_prompts_1.printer.error(errMessage);
        return;
    }
    const selectedAuthResource = await amplify_prompts_1.prompter.pick(`Which resource would you like to add overrides for?`, authResources);
    let authResourceName;
    if (selectedAuthResource === 'userPoolGroups') {
        authResourceName = await (0, getAuthResourceName_1.getAuthResourceName)(context);
        await (0, check_for_auth_migration_1.checkAuthResourceMigration)(context, authResourceName, false);
    }
    else {
        await (0, check_for_auth_migration_1.checkAuthResourceMigration)(context, selectedAuthResource, false);
    }
    if (selectedAuthResource === 'userPoolGroups') {
        await generateOverrideForAuthResource(context, selectedAuthResource, 'userPoolGroups');
    }
    else {
        await generateOverrideForAuthResource(context, selectedAuthResource, 'auth');
    }
};
exports.run = run;
const generateOverrideForAuthResource = async (context, resourceName, resourceType) => {
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const destPath = path_1.default.normalize(path_1.default.join(backendDir, category, resourceName));
    const srcPath = path_1.default.normalize(path_1.default.join(__dirname, '..', '..', '..', 'resources', 'overrides-resource', resourceType));
    await (0, amplify_cli_core_1.generateOverrideSkeleton)(context, srcPath, destPath);
};
//# sourceMappingURL=override.js.map