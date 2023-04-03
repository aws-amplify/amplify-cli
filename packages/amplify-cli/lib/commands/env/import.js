"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const run = async (context) => {
    var _a, _b, _c, _d, _e;
    const envName = (_a = context.parameters.options) === null || _a === void 0 ? void 0 : _a.name;
    if (!envName) {
        throw new amplify_cli_core_1.AmplifyError('EnvironmentNameError', {
            message: 'Environment name was not specified.',
            resolution: 'Pass in the name of the environment using the --name flag.',
        });
    }
    let config;
    try {
        config = amplify_cli_core_1.JSONUtilities.parse((_c = (_b = context.parameters.options) === null || _b === void 0 ? void 0 : _b.config) !== null && _c !== void 0 ? _c : '{}');
        const awsCF = config.awscloudformation;
        if (!((config.hasOwnProperty('awscloudformation') &&
            awsCF.hasOwnProperty('Region') &&
            awsCF.Region &&
            awsCF.hasOwnProperty('DeploymentBucketName') &&
            awsCF.DeploymentBucketName &&
            awsCF.hasOwnProperty('UnauthRoleName') &&
            awsCF.UnauthRoleName &&
            awsCF.hasOwnProperty('StackName') &&
            awsCF.StackName &&
            awsCF.hasOwnProperty('StackId') &&
            awsCF.StackId &&
            awsCF.hasOwnProperty('AuthRoleName') &&
            awsCF.AuthRoleName &&
            awsCF.hasOwnProperty('UnauthRoleArn') &&
            awsCF.UnauthRoleArn &&
            awsCF.hasOwnProperty('AuthRoleArn') &&
            awsCF.AuthRoleArn))) {
            throw new amplify_cli_core_1.AmplifyError('EnvironmentConfigurationError', {
                message: 'The environment configuration provided is missing required properties.',
                resolution: 'Add the required properties and try again.',
                link: 'https://docs.amplify.aws/cli/teams/commands/#import-an-environment',
            });
        }
    }
    catch (e) {
        throw new amplify_cli_core_1.AmplifyError('EnvironmentConfigurationError', {
            message: 'Environment configuration was not specified or was formatted incorrectly.',
            resolution: 'You must pass in the configuration of the environment in an object format using the --config flag.',
        }, e);
    }
    let awsInfo;
    if ((_d = context.parameters.options) === null || _d === void 0 ? void 0 : _d.awsInfo) {
        try {
            awsInfo = amplify_cli_core_1.JSONUtilities.parse(context.parameters.options.awsInfo);
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyError('EnvironmentConfigurationError', {
                message: 'The AWS credential info was not specified or was incorrectly formatted.',
                resolution: 'Pass in the AWS credential info in an object format using the --awsInfo flag.',
                link: 'https://docs.amplify.aws/cli/teams/commands/#import-an-environment',
            }, e);
        }
    }
    const allEnvs = context.amplify.getEnvDetails();
    const addNewEnvConfig = () => {
        allEnvs[envName] = config;
        amplify_cli_core_1.stateManager.setTeamProviderInfo(undefined, allEnvs);
        const envAwsInfo = amplify_cli_core_1.stateManager.getLocalAWSInfo(undefined, {
            throwIfNotExist: false,
            default: {},
        });
        envAwsInfo[envName] = awsInfo;
        amplify_cli_core_1.stateManager.setLocalAWSInfo(undefined, envAwsInfo);
        amplify_prompts_1.printer.success('Successfully added environment from your project');
    };
    if (allEnvs.hasOwnProperty(envName)) {
        if ((_e = context.parameters.options) === null || _e === void 0 ? void 0 : _e.yes) {
            addNewEnvConfig();
        }
        else if (await context.amplify.confirmPrompt('We found an environment with the same name. Do you want to overwrite the existing environment config?')) {
            addNewEnvConfig();
        }
    }
    else {
        addNewEnvConfig();
    }
};
exports.run = run;
//# sourceMappingURL=import.js.map