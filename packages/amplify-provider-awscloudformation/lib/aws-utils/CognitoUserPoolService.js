"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoUserPoolService = exports.createCognitoUserPoolService = void 0;
const aws_sdk_1 = require("aws-sdk");
const configuration_manager_1 = require("../configuration-manager");
const aws_logger_1 = require("../utils/aws-logger");
const paged_call_1 = require("./paged-call");
const logger = (0, aws_logger_1.fileLogger)('CognitoUserPoolService');
const createCognitoUserPoolService = async (context, options) => {
    let credentials = {};
    try {
        credentials = await (0, configuration_manager_1.loadConfiguration)(context);
    }
    catch (e) {
    }
    const cognito = new aws_sdk_1.CognitoIdentityServiceProvider({ ...credentials, ...options });
    return new CognitoUserPoolService(cognito);
};
exports.createCognitoUserPoolService = createCognitoUserPoolService;
class CognitoUserPoolService {
    constructor(cognito) {
        this.cognito = cognito;
        this.cachedUserPoolIds = [];
    }
    async listUserPools() {
        if (this.cachedUserPoolIds.length === 0) {
            const result = await (0, paged_call_1.pagedAWSCall)(async (params, nextToken) => {
                logger('listUserPool.cognito.listUserPools', [{ params, NextToken: nextToken }])();
                return await this.cognito
                    .listUserPools({
                    ...params,
                    NextToken: nextToken,
                })
                    .promise();
            }, {
                MaxResults: 60,
            }, (response) => response === null || response === void 0 ? void 0 : response.UserPools, async (response) => response === null || response === void 0 ? void 0 : response.NextToken);
            this.cachedUserPoolIds.push(...result);
        }
        return this.cachedUserPoolIds;
    }
    async getUserPoolDetails(userPoolId) {
        logger('getUserPoolDetails.cognito.describeUserPool', [{ userPoolId }])();
        const result = await this.cognito
            .describeUserPool({
            UserPoolId: userPoolId,
        })
            .promise();
        return result.UserPool;
    }
    async listUserPoolClients(userPoolId) {
        const userPoolClients = await (0, paged_call_1.pagedAWSCall)(async (params, nextToken) => {
            logger('listUserPoolClients.cognito.listUserPoolClients', [{ params, NextToken: nextToken }])();
            return await this.cognito
                .listUserPoolClients({
                ...params,
                NextToken: nextToken,
            })
                .promise();
        }, {
            UserPoolId: userPoolId,
            MaxResults: 60,
        }, (response) => response === null || response === void 0 ? void 0 : response.UserPoolClients, async (response) => response === null || response === void 0 ? void 0 : response.NextToken);
        const userPoolClientDetails = [];
        if (userPoolClients.length > 0) {
            const describeUserPoolClientPromises = userPoolClients.map((upc) => {
                logger('listUserPoolClients.cognito.listUserPoolClients', [
                    {
                        UserPoolId: userPoolId,
                        ClientId: upc.ClientId,
                    },
                ])();
                return this.cognito
                    .describeUserPoolClient({
                    UserPoolId: userPoolId,
                    ClientId: upc.ClientId,
                })
                    .promise();
            });
            const userPoolClientDetailsResults = await Promise.all(describeUserPoolClientPromises);
            userPoolClientDetails.push(...userPoolClientDetailsResults.map((response) => response.UserPoolClient));
        }
        return userPoolClientDetails;
    }
    async listUserPoolIdentityProviders(userPoolId) {
        const identityProviders = await (0, paged_call_1.pagedAWSCall)(async (params, nextToken) => {
            logger('listUserPoolIdentityProviders.cognito.listIdentityProviders', [
                {
                    ...params,
                    NextToken: nextToken,
                },
            ])();
            return await this.cognito
                .listIdentityProviders({
                ...params,
                NextToken: nextToken,
            })
                .promise();
        }, {
            UserPoolId: userPoolId,
            MaxResults: 60,
        }, (response) => response === null || response === void 0 ? void 0 : response.Providers, async (response) => response === null || response === void 0 ? void 0 : response.NextToken);
        const identityPoolDetails = [];
        if (identityProviders.length > 0) {
            const describeIdentityProviderPromises = identityProviders.map((idp) => {
                logger('listUserPoolIdentityProviders.cognito.describeIdentityProviderPromises', [
                    {
                        UserPoolId: userPoolId,
                        ProviderName: idp.ProviderName,
                    },
                ])();
                return this.cognito
                    .describeIdentityProvider({
                    UserPoolId: userPoolId,
                    ProviderName: idp.ProviderName,
                })
                    .promise();
            });
            const identityProviderDetailsResults = await Promise.all(describeIdentityProviderPromises);
            identityPoolDetails.push(...identityProviderDetailsResults.map((response) => response.IdentityProvider));
        }
        return identityPoolDetails;
    }
    async getUserPoolMfaConfig(userPoolId) {
        logger('getUserPoolMfaConfig.cognito.getUserPoolMfaConfig', [
            {
                UserPoolId: userPoolId,
            },
        ])();
        const result = await this.cognito
            .getUserPoolMfaConfig({
            UserPoolId: userPoolId,
        })
            .promise();
        return result;
    }
}
exports.CognitoUserPoolService = CognitoUserPoolService;
//# sourceMappingURL=CognitoUserPoolService.js.map