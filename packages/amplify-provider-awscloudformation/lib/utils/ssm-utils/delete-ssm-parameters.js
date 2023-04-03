"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEnvironmentParametersFromService = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const aws_ssm_1 = require("../../aws-utils/aws-ssm");
const resolve_appId_1 = require("../resolve-appId");
const exp_backoff_executor_1 = require("./exp-backoff-executor");
const get_ssm_sdk_parameters_1 = require("./get-ssm-sdk-parameters");
const deleteEnvironmentParametersFromService = async (context, envName) => {
    let appId;
    try {
        appId = (0, resolve_appId_1.resolveAppId)(context);
    }
    catch (_a) {
        amplify_prompts_1.printer.debug(`No AppId found when deleting parameters for environment ${envName}`);
        return;
    }
    const { client } = await aws_ssm_1.SSM.getInstance(context);
    await deleteParametersFromParameterStore(appId, envName, client);
};
exports.deleteEnvironmentParametersFromService = deleteEnvironmentParametersFromService;
const deleteParametersFromParameterStore = async (appId, envName, ssmClient) => {
    try {
        const envKeysInParameterStore = await getAllEnvParametersFromParameterStore(appId, envName, ssmClient);
        if (!envKeysInParameterStore.length) {
            return;
        }
        const chunkedKeys = chunkForParameterStore(envKeysInParameterStore);
        const deleteKeysFromPSPromises = chunkedKeys.map((keys) => {
            const ssmArgument = (0, get_ssm_sdk_parameters_1.getSsmSdkParametersDeleteParameters)(keys);
            return () => ssmClient.deleteParameters(ssmArgument).promise();
        });
        await (0, exp_backoff_executor_1.executeSdkPromisesWithExponentialBackOff)(deleteKeysFromPSPromises);
    }
    catch (e) {
        throw new amplify_cli_core_1.AmplifyFault('ParametersDeleteFault', {
            message: `Failed to delete parameters from the service`,
        }, e);
    }
};
function isAmplifyParameter(parameter) {
    const keyPrefix = 'AMPLIFY_';
    const splitParam = parameter.split('/');
    const lastPartOfPath = splitParam.slice(-1).pop();
    return lastPartOfPath.startsWith(keyPrefix);
}
const getAllEnvParametersFromParameterStore = async (appId, envName, ssmClient) => {
    const parametersUnderPath = [];
    let receivedNextToken = '';
    do {
        const ssmArgument = (0, get_ssm_sdk_parameters_1.getSsmSdkParametersGetParametersByPath)(appId, envName, receivedNextToken);
        const [data] = await (0, exp_backoff_executor_1.executeSdkPromisesWithExponentialBackOff)([() => ssmClient.getParametersByPath(ssmArgument).promise()]);
        parametersUnderPath.push(...data.Parameters.map((returnedParameter) => returnedParameter.Name).filter((name) => isAmplifyParameter(name)));
        receivedNextToken = data.NextToken;
    } while (receivedNextToken);
    return parametersUnderPath;
};
const chunkForParameterStore = (keys) => {
    const maxLength = 10;
    const chunkedKeys = [];
    let lastChunk = [];
    chunkedKeys.push(lastChunk);
    keys.forEach((key) => {
        if (lastChunk.length === maxLength) {
            lastChunk = [];
            chunkedKeys.push(lastChunk);
        }
        lastChunk.push(key);
    });
    return chunkedKeys;
};
//# sourceMappingURL=delete-ssm-parameters.js.map