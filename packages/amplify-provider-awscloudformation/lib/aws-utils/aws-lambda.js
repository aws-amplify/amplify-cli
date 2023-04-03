"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lambda = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const configuration_manager_1 = require("../configuration-manager");
const aws_logger_1 = require("../utils/aws-logger");
const paged_call_1 = require("./paged-call");
const aws = require('./aws');
const logger = (0, aws_logger_1.fileLogger)('aws-lambda');
class Lambda {
    constructor(context, options = {}) {
        this.context = context;
        return (async () => {
            let cred;
            try {
                cred = await (0, configuration_manager_1.loadConfiguration)(context);
            }
            catch (e) {
            }
            this.lambda = new aws.Lambda({ ...cred, ...options });
            return this;
        })();
    }
    async listLayerVersions(layerNameOrArn) {
        const startingParams = { LayerName: layerNameOrArn, MaxItems: 20 };
        const result = await (0, paged_call_1.pagedAWSCall)(async (params, nextMarker) => {
            params = nextMarker ? { ...params, Marker: nextMarker } : params;
            logger('Lambda.listLayerVersions', [params])();
            return await this.lambda.listLayerVersions(params).promise();
        }, startingParams, (response) => response === null || response === void 0 ? void 0 : response.LayerVersions, async (response) => response === null || response === void 0 ? void 0 : response.NextMarker);
        return result;
    }
    async deleteLayerVersions(layerNameOrArn, versions) {
        const params = { LayerName: layerNameOrArn, VersionNumber: undefined };
        const deletionPromises = [];
        for (const version of versions) {
            params.VersionNumber = version;
            deletionPromises.push(async () => {
                try {
                    await this.lambda.deleteLayerVersion(params).promise();
                }
                catch (err) {
                    if (err.code !== 'ParameterNotFound') {
                        throw new amplify_cli_core_1.AmplifyError('LambdaLayerDeleteError', {
                            message: err.message,
                        }, err);
                    }
                }
            });
        }
        try {
            await Promise.all(deletionPromises);
        }
        catch (e) {
            this.context.print.error('Failed to delete some or all layer versions. Check your internet connection and try again. ' +
                'If the problem persists, try deleting the versions in the Lambda console.');
            e.stack = undefined;
            this.context.print.error(e);
            await this.context.usageData.emitError(e);
        }
    }
}
exports.Lambda = Lambda;
//# sourceMappingURL=aws-lambda.js.map