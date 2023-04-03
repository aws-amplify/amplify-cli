"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePermissionsBoundaryForInit = exports.configurePermissionsBoundaryForExistingEnv = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const inquirer_1 = require("inquirer");
const aws_iam_1 = require("../aws-utils/aws-iam");
const configurePermissionsBoundaryForExistingEnv = async (context) => {
    (0, amplify_cli_core_1.setPermissionsBoundaryArn)(await permissionsBoundarySupplier(context));
    context.print.info('Run `amplify push --force` to update IAM permissions boundary if you have no other resource changes.\nRun `amplify push` to deploy IAM permissions boundary alongside other cloud resource changes.');
};
exports.configurePermissionsBoundaryForExistingEnv = configurePermissionsBoundaryForExistingEnv;
const configurePermissionsBoundaryForInit = async (context) => {
    var _a;
    const { envName } = context.exeInfo.localEnvInfo;
    if ((_a = context === null || context === void 0 ? void 0 : context.exeInfo) === null || _a === void 0 ? void 0 : _a.isNewProject) {
        (0, amplify_cli_core_1.setPermissionsBoundaryArn)(await permissionsBoundarySupplier(context, { doPrompt: false, envNameSupplier: () => envName }), envName, context.exeInfo.teamProviderInfo);
    }
    else {
        await rolloverPermissionsBoundaryToNewEnvironment(context);
    }
};
exports.configurePermissionsBoundaryForInit = configurePermissionsBoundaryForInit;
const permissionsBoundarySupplierDefaultOptions = {
    required: false,
    doPrompt: true,
    envNameSupplier: () => amplify_cli_core_1.stateManager.getLocalEnvInfo().envName,
};
const permissionsBoundarySupplier = async (context, options) => {
    var _a, _b, _c, _d;
    const { required, doPrompt, envNameSupplier } = { ...permissionsBoundarySupplierDefaultOptions, ...options };
    const headlessPermissionsBoundary = (_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b['permissions-boundary'];
    const validate = context.amplify.inputValidation({
        operator: 'regex',
        value: '^(|arn:aws:iam::(\\d{12}|aws):policy/.+)$',
        onErrorMsg: 'Specify a valid IAM Policy ARN',
        required: true,
    });
    if (typeof headlessPermissionsBoundary === 'string') {
        if (validate(headlessPermissionsBoundary)) {
            return headlessPermissionsBoundary;
        }
        context.print.error('The permissions boundary ARN specified is not a valid IAM Policy ARN');
    }
    const isYes = (_d = (_c = context === null || context === void 0 ? void 0 : context.input) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.yes;
    if (required && (isYes || !doPrompt)) {
        throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
            message: 'A permissions boundary ARN must be specified using --permissions-boundary',
            link: `${amplify_cli_core_1.AMPLIFY_DOCS_URL}/cli/project/permissions-boundary/`,
        });
    }
    if (!doPrompt) {
        return undefined;
    }
    const envName = envNameSupplier();
    const defaultValue = (0, amplify_cli_core_1.getPermissionsBoundaryArn)(envName);
    const hasDefault = typeof defaultValue === 'string' && defaultValue.length > 0;
    const promptSuffix = hasDefault ? ' (leave blank to remove the permissions boundary configuration)' : '';
    const { permissionsBoundaryArn } = await (0, inquirer_1.prompt)({
        type: 'input',
        name: 'permissionsBoundaryArn',
        message: `Specify an IAM Policy ARN to use as a permissions boundary for all Amplify-generated IAM Roles in the ${envName} environment${promptSuffix}:`,
        default: defaultValue,
        validate,
    });
    return permissionsBoundaryArn;
};
const rolloverPermissionsBoundaryToNewEnvironment = async (context) => {
    var _a, _b;
    const newEnv = context.exeInfo.localEnvInfo.envName;
    const headlessPermissionsBoundary = await permissionsBoundarySupplier(context, { doPrompt: false, envNameSupplier: () => newEnv });
    if (typeof headlessPermissionsBoundary === 'string') {
        (0, amplify_cli_core_1.setPermissionsBoundaryArn)(headlessPermissionsBoundary, newEnv, context.exeInfo.teamProviderInfo);
        return;
    }
    const currBoundary = (0, amplify_cli_core_1.getPermissionsBoundaryArn)();
    if (!currBoundary) {
        return;
    }
    const currEnv = (_b = (_a = amplify_cli_core_1.stateManager.getLocalEnvInfo()) === null || _a === void 0 ? void 0 : _a.envName) !== null && _b !== void 0 ? _b : 'current';
    if (await isPolicyAccessible(context, currBoundary)) {
        (0, amplify_cli_core_1.setPermissionsBoundaryArn)(currBoundary, newEnv, context.exeInfo.teamProviderInfo);
        context.print.info(`Permissions boundary ${currBoundary} from the ${currEnv} environment has automatically been applied to the ${newEnv} environment.\nTo modify this, run \`amplify env update\`.\n`);
        return;
    }
    context.print.warning(`Permissions boundary ${currBoundary} from the ${currEnv} environment cannot be applied to resources the ${newEnv} environment.`);
    (0, amplify_cli_core_1.setPermissionsBoundaryArn)(await permissionsBoundarySupplier(context, { required: true, envNameSupplier: () => newEnv }), newEnv, context.exeInfo.teamProviderInfo);
};
const isPolicyAccessible = async (context, policyArn) => {
    const iamClient = await aws_iam_1.IAMClient.getInstance(context);
    try {
        await iamClient.client.getPolicy({ PolicyArn: policyArn }).promise();
    }
    catch (err) {
        if ((err === null || err === void 0 ? void 0 : err.statusCode) === 404) {
            return false;
        }
        return true;
    }
    return true;
};
//# sourceMappingURL=permissions-boundary.js.map