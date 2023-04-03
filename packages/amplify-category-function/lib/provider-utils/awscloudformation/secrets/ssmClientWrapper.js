"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSMClientWrapper = void 0;
class SSMClientWrapper {
    constructor(ssmClient) {
        this.ssmClient = ssmClient;
        this.getSecrets = async (secretNames) => {
            var _b;
            if (!secretNames || secretNames.length === 0) {
                return [];
            }
            const result = await this.ssmClient
                .getParameters({
                Names: secretNames,
                WithDecryption: true,
            })
                .promise();
            return (_b = result === null || result === void 0 ? void 0 : result.Parameters) === null || _b === void 0 ? void 0 : _b.map(({ Name, Value }) => ({ secretName: Name, secretValue: Value }));
        };
        this.getSecretNamesByPath = async (secretPath) => {
            let NextToken;
            const accumulator = [];
            do {
                const result = await this.ssmClient
                    .getParametersByPath({
                    Path: secretPath,
                    MaxResults: 10,
                    ParameterFilters: [
                        {
                            Key: 'Type',
                            Option: 'Equals',
                            Values: ['SecureString'],
                        },
                    ],
                    NextToken,
                })
                    .promise();
                if (Array.isArray(result === null || result === void 0 ? void 0 : result.Parameters)) {
                    accumulator.push(...result.Parameters.filter((param) => (param === null || param === void 0 ? void 0 : param.Name) !== undefined).map((param) => param.Name));
                }
                NextToken = result.NextToken;
            } while (NextToken);
            return accumulator;
        };
        this.setSecret = async (secretName, secretValue) => {
            await this.ssmClient
                .putParameter({
                Name: secretName,
                Value: secretValue,
                Type: 'SecureString',
                Overwrite: true,
            })
                .promise();
        };
        this.deleteSecret = async (secretName) => {
            await this.ssmClient
                .deleteParameter({
                Name: secretName,
            })
                .promise()
                .catch((err) => {
                if (err.code !== 'ParameterNotFound') {
                    throw err;
                }
            });
        };
        this.deleteSecrets = async (secretNames) => {
            try {
                await this.ssmClient.deleteParameters({ Names: secretNames }).promise();
            }
            catch (err) {
                if (err.code !== 'ParameterNotFound') {
                    throw err;
                }
            }
        };
    }
}
exports.SSMClientWrapper = SSMClientWrapper;
_a = SSMClientWrapper;
SSMClientWrapper.getInstance = async (context) => {
    if (!SSMClientWrapper.instance) {
        SSMClientWrapper.instance = new SSMClientWrapper(await getSSMClient(context));
    }
    return SSMClientWrapper.instance;
};
const getSSMClient = async (context) => {
    const { client } = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getConfiguredSSMClient', [context]);
    return client;
};
//# sourceMappingURL=ssmClientWrapper.js.map