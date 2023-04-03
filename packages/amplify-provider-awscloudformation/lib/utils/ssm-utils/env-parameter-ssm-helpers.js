"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvParametersDownloadHandler = exports.getEnvParametersUploadHandler = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const aws_ssm_1 = require("../../aws-utils/aws-ssm");
const resolve_appId_1 = require("../resolve-appId");
const exp_backoff_executor_1 = require("./exp-backoff-executor");
const getEnvParametersUploadHandler = async (context) => {
    let appId;
    try {
        appId = (0, resolve_appId_1.resolveAppId)(context);
    }
    catch (_a) {
        amplify_prompts_1.printer.warn('Failed to resolve AppId, skipping parameter download.');
        return (__, ___) => new Promise((resolve) => {
            resolve();
        });
    }
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const { client } = await aws_ssm_1.SSM.getInstance(context);
    return uploadParameterToParameterStore(appId, envName, client);
};
exports.getEnvParametersUploadHandler = getEnvParametersUploadHandler;
const uploadParameterToParameterStore = (appId, envName, ssmClient) => {
    return async (key, value) => {
        try {
            const stringValue = JSON.stringify(value);
            const sdkParameters = {
                Name: `/amplify/${appId}/${envName}/${key}`,
                Overwrite: true,
                Tier: 'Standard',
                Type: 'String',
                Value: stringValue,
            };
            await (0, exp_backoff_executor_1.executeSdkPromisesWithExponentialBackOff)([() => ssmClient.putParameter(sdkParameters).promise()]);
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyFault('ParameterUploadFault', {
                message: `Failed to upload ${key} to ParameterStore`,
            }, e);
        }
    };
};
const getEnvParametersDownloadHandler = async (context) => {
    let appId;
    try {
        appId = (0, resolve_appId_1.resolveAppId)(context);
    }
    catch (_a) {
        amplify_prompts_1.printer.warn('Failed to resolve AppId, skipping parameter download.');
        return (__) => new Promise((resolve) => {
            resolve({});
        });
    }
    const envName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const { client } = await aws_ssm_1.SSM.getInstance(context);
    return downloadParametersFromParameterStore(appId, envName, client);
};
exports.getEnvParametersDownloadHandler = getEnvParametersDownloadHandler;
const downloadParametersFromParameterStore = (appId, envName, ssmClient) => {
    return async (keys) => {
        if (keys.length === 0) {
            return {};
        }
        try {
            const keyPaths = keys.map((key) => `/amplify/${appId}/${envName}/${key}`);
            const sdkPromises = convertKeyPathsToSdkPromises(ssmClient, keyPaths);
            const results = await (0, exp_backoff_executor_1.executeSdkPromisesWithExponentialBackOff)(sdkPromises);
            return results.reduce((acc, { Parameters }) => {
                Parameters.forEach((param) => {
                    const [, , , , key] = param.Name.split('/');
                    acc[key] = JSON.parse(param.Value);
                });
                return acc;
            }, {});
        }
        catch (e) {
            throw new amplify_cli_core_1.AmplifyFault('ParameterDownloadFault', {
                message: `Failed to download the following parameters from ParameterStore:\n  ${keys.join('\n  ')}`,
            }, e);
        }
    };
};
const convertKeyPathsToSdkPromises = (ssmClient, keyPaths) => {
    const sdkParameterChunks = [];
    for (let i = 0; i < keyPaths.length; i += 10) {
        sdkParameterChunks.push({
            Names: keyPaths.slice(i, Math.min(i + 10, keyPaths.length)),
            WithDecryption: false,
        });
    }
    return sdkParameterChunks.map((sdkParameters) => () => ssmClient.getParameters(sdkParameters).promise());
};
//# sourceMappingURL=env-parameter-ssm-helpers.js.map