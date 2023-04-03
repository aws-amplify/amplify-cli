"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityPoolService = exports.createIdentityPoolService = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_sdk_1 = require("aws-sdk");
const configuration_manager_1 = require("../configuration-manager");
const paged_call_1 = require("./paged-call");
const createIdentityPoolService = async (context, options) => {
    let credentials = {};
    try {
        credentials = await (0, configuration_manager_1.loadConfiguration)(context);
    }
    catch (e) {
    }
    const cognitoIdentity = new aws_sdk_1.CognitoIdentity({ ...credentials, ...options });
    return new IdentityPoolService(cognitoIdentity);
};
exports.createIdentityPoolService = createIdentityPoolService;
class IdentityPoolService {
    constructor(cognitoIdentity) {
        this.cognitoIdentity = cognitoIdentity;
        this.cachedIdentityPoolIds = [];
        this.cachedIdentityPoolDetails = [];
        this.getResourceNameFromArn = (arn) => {
            let resourceName;
            if (arn) {
                const parts = arn.split('/');
                if (parts.length === 2) {
                    resourceName = parts[1];
                }
            }
            if (!resourceName) {
                throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                    message: `Cannot parse arn: '${arn}'.`,
                });
            }
            return resourceName;
        };
    }
    async listIdentityPools() {
        if (this.cachedIdentityPoolIds.length === 0) {
            const result = await (0, paged_call_1.pagedAWSCall)(async (params, nextToken) => await this.cognitoIdentity
                .listIdentityPools({
                ...params,
                NextToken: nextToken,
            })
                .promise(), {
                MaxResults: 60,
            }, (response) => response === null || response === void 0 ? void 0 : response.IdentityPools, async (response) => response === null || response === void 0 ? void 0 : response.NextToken);
            this.cachedIdentityPoolIds.push(...result);
        }
        return this.cachedIdentityPoolIds;
    }
    async listIdentityPoolDetails() {
        if (this.cachedIdentityPoolDetails.length === 0) {
            const identityPools = await this.listIdentityPools();
            const identityPoolDetails = [];
            if (identityPools.length > 0) {
                const describeIdentityPoolPromises = identityPools.map((idp) => this.cognitoIdentity
                    .describeIdentityPool({
                    IdentityPoolId: idp.IdentityPoolId,
                })
                    .promise());
                const identityPoolDetailResults = await Promise.all(describeIdentityPoolPromises);
                identityPoolDetails.push(...identityPoolDetailResults);
            }
            this.cachedIdentityPoolDetails.push(...identityPoolDetails);
        }
        return this.cachedIdentityPoolDetails;
    }
    async getIdentityPoolRoles(identityPoolId) {
        const response = await this.cognitoIdentity
            .getIdentityPoolRoles({
            IdentityPoolId: identityPoolId,
        })
            .promise();
        if (!response.Roles || !response.Roles.authenticated || !response.Roles.unauthenticated) {
            throw new amplify_cli_core_1.AmplifyError('AuthImportError', {
                message: `Cannot import Identity Pool without 'authenticated' and 'unauthenticated' roles.`,
            });
        }
        return {
            authRoleArn: response.Roles.authenticated,
            authRoleName: this.getResourceNameFromArn(response.Roles.authenticated),
            unauthRoleArn: response.Roles.unauthenticated,
            unauthRoleName: this.getResourceNameFromArn(response.Roles.unauthenticated),
        };
    }
}
exports.IdentityPoolService = IdentityPoolService;
//# sourceMappingURL=IdentityPoolService.js.map