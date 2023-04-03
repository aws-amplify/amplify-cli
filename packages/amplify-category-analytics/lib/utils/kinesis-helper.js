"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasResource = exports.console = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const console = async (context) => {
    const amplifyMeta = context.amplify.getProjectMeta();
    const { envName } = context.amplify.getEnvInfo();
    const region = context.amplify.getEnvDetails()[envName].awscloudformation.Region;
    const kinesisApp = scanCategoryMetaForKinesis(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]);
    if (kinesisApp) {
        const { Id } = kinesisApp;
        const consoleUrl = `https://${region}.console.aws.amazon.com/kinesis/home?region=${region}#/streams/details?streamName=${Id}&tab=details`;
        await (0, amplify_cli_core_1.open)(consoleUrl, { wait: false });
    }
    else {
        amplify_prompts_1.printer.error('Kinesis is not enabled in the cloud.');
    }
};
exports.console = console;
const scanCategoryMetaForKinesis = (categoryMeta) => {
    let result;
    if (categoryMeta) {
        const services = Object.keys(categoryMeta);
        for (const service of services) {
            const serviceMeta = categoryMeta[service];
            if (serviceMeta.service === amplify_cli_core_1.AmplifySupportedService.KINESIS && serviceMeta.output && serviceMeta.output.kinesisStreamId) {
                result = {
                    Id: serviceMeta.output.kinesisStreamId,
                };
                if (serviceMeta.output.Name) {
                    result.Name = serviceMeta.output.Name;
                }
                else if (serviceMeta.output.appName) {
                    result.Name = serviceMeta.output.appName;
                }
                if (serviceMeta.output.Region) {
                    result.Region = serviceMeta.output.Region;
                }
                break;
            }
        }
    }
    return result;
};
const hasResource = (context) => {
    const amplifyMeta = context.amplify.getProjectMeta();
    return scanCategoryMetaForKinesis(amplifyMeta[amplify_cli_core_1.AmplifyCategories.ANALYTICS]) !== undefined;
};
exports.hasResource = hasResource;
//# sourceMappingURL=kinesis-helper.js.map