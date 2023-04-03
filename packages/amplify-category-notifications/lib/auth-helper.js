"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRolePolicy = exports.ensureAuth = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const ora_1 = __importDefault(require("ora"));
const os_1 = __importDefault(require("os"));
const providerName = 'awscloudformation';
const policyNamePrefix = 'pinpoint_amplify-';
const spinner = (0, ora_1.default)('');
const ensureAuth = async (context, resourceName) => {
    try {
        spinner.start('Creating and attaching IAM policy.');
        const policy = await createPolicy(context);
        await attachPolicy(context, policy);
        spinner.succeed('Successfully set the IAM policy');
    }
    catch (e) {
        spinner.fail('Error occurred during IAM policy setup.');
        throw e;
    }
    await checkAuth(context, resourceName);
};
exports.ensureAuth = ensureAuth;
const createPolicy = async (context) => {
    const params = {
        PolicyName: getPolicyName(context),
        PolicyDocument: getPolicyDoc(context),
    };
    const iamClient = await getIamClient(context, undefined);
    return new Promise((resolve, reject) => {
        iamClient.createPolicy(params, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data.Policy);
            }
        });
    });
};
const attachPolicy = async (context, policy) => {
    const { amplifyMeta } = context.exeInfo;
    const authRoleName = amplifyMeta.providers[providerName].AuthRoleName;
    const unAuthRoleName = amplifyMeta.providers[providerName].UnauthRoleName;
    await attachPolicyToRole(context, policy, authRoleName);
    await attachPolicyToRole(context, policy, unAuthRoleName);
};
const attachPolicyToRole = async (context, policy, roleName) => {
    const params = {
        RoleName: roleName,
        PolicyArn: policy.Arn,
    };
    const iamClient = await getIamClient(context, 'update');
    return new Promise((resolve, reject) => {
        iamClient.attachRolePolicy(params, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
};
const deletePolicy = async (context, policyArn) => {
    const params = {
        PolicyArn: policyArn,
    };
    const iamClient = await getIamClient(context, undefined);
    return iamClient.deletePolicy(params).promise();
};
const detachPolicyFromRole = async (context, policyArn, roleName) => {
    const params = {
        PolicyArn: policyArn,
        RoleName: roleName,
    };
    const iamClient = await getIamClient(context, undefined);
    return iamClient.detachRolePolicy(params).promise();
};
const listAttachedRolePolicies = async (context, roleName) => {
    const params = { RoleName: roleName };
    const iamClient = await getIamClient(context, undefined);
    return iamClient.listAttachedRolePolicies(params).promise();
};
const deleteRolePolicy = async (context) => {
    const amplifyMeta = context.amplify.getProjectMeta();
    const authRoleName = amplifyMeta.providers[providerName].AuthRoleName;
    const unAuthRoleName = amplifyMeta.providers[providerName].UnauthRoleName;
    const rolePolicies = await listAttachedRolePolicies(context, authRoleName);
    if (rolePolicies && Array.isArray(rolePolicies.AttachedPolicies)) {
        const policy = rolePolicies.AttachedPolicies.find((attachedPolicy) => attachedPolicy.PolicyName.startsWith(policyNamePrefix));
        if (policy) {
            await detachPolicyFromRole(context, policy.PolicyArn, authRoleName);
            await detachPolicyFromRole(context, policy.PolicyArn, unAuthRoleName);
            await deletePolicy(context, policy.PolicyArn);
        }
    }
};
exports.deleteRolePolicy = deleteRolePolicy;
const checkAuth = async (context, resourceName) => {
    const apiRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        apiRequirements,
        context,
        amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
        resourceName,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new amplify_cli_core_1.AmplifyError('ConfigurationError', {
            message: checkResult.errors.join(os_1.default.EOL),
        });
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        amplify_prompts_1.printer.warn(checkResult.errors.join(os_1.default.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        amplify_prompts_1.printer.warn(`Adding ${amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS} would also add the Auth category to the project if not already added.`);
        await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
            context,
            amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS,
            resourceName,
            apiRequirements,
        ]);
        amplify_prompts_1.printer.warn('Execute "amplify push" to update the Auth resources in the cloud.');
    }
};
const getIamClient = async (context, action) => {
    const providerPlugins = context.amplify.getProviderPlugins(context);
    const provider = require(providerPlugins[providerName]);
    const aws = await provider.getConfiguredAWSClient(context, amplify_cli_core_1.AmplifyCategories.NOTIFICATIONS, action);
    return new aws.IAM();
};
const getPolicyDoc = (context) => {
    const { amplifyMeta, pinpointApp } = context.exeInfo;
    const authRoleArn = amplifyMeta.providers[providerName].AuthRoleArn;
    const accountNumber = authRoleArn.split(':')[4];
    const pinpointAppId = pinpointApp.Id;
    const policy = {
        Version: '2012-10-17',
        Statement: [
            {
                Effect: 'Allow',
                Action: ['mobiletargeting:PutEvents', 'mobiletargeting:UpdateEndpoint'],
                Resource: [`arn:aws:mobiletargeting:*:${accountNumber}:apps/${pinpointAppId}*`],
            },
        ],
    };
    return JSON.stringify(policy);
};
const getPolicyName = (context) => `${policyNamePrefix}${context.amplify.makeId(8)}`;
//# sourceMappingURL=auth-helper.js.map