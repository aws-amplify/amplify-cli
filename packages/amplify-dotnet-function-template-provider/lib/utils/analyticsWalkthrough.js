"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAnalyticsCategoryKinesisQuestions = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
async function askAnalyticsCategoryKinesisQuestions(context) {
    const { amplify } = context;
    const { allResources } = await amplify.getResourceStatus();
    const kinesisResources = allResources.filter((resource) => resource.service === 'Kinesis');
    let targetResourceName;
    if (kinesisResources.length === 0) {
        const errMessage = 'No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream';
        context.print.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
        return undefined;
    }
    else if (kinesisResources.length === 1) {
        targetResourceName = kinesisResources[0].resourceName;
        context.print.success(`Selected resource ${targetResourceName}`);
    }
    else {
        const resourceNameQuestion = {
            type: 'list',
            name: 'kinesisAnalyticsResourceName',
            message: 'Select an Analytics resource Kinesis stream to associate with',
            choices: kinesisResources.map((resource) => resource.resourceName),
        };
        const answer = await inquirer_1.default.prompt([resourceNameQuestion]);
        targetResourceName = answer.kinesisAnalyticsResourceName;
    }
    const streamArnParamRef = {
        Ref: `analytics${targetResourceName}kinesisStreamArn`,
    };
    return {
        triggerEventSourceMappings: [
            {
                batchSize: 100,
                startingPosition: 'LATEST',
                eventSourceArn: streamArnParamRef,
                functionTemplateType: 'kinesis',
                functionTemplateName: 'Kinesis.cs.ejs',
                triggerPolicies: [
                    {
                        Effect: 'Allow',
                        Action: [
                            'kinesis:DescribeStream',
                            'kinesis:DescribeStreamSummary',
                            'kinesis:GetRecords',
                            'kinesis:GetShardIterator',
                            'kinesis:ListShards',
                            'kinesis:ListStreams',
                            'kinesis:SubscribeToShard',
                        ],
                        Resource: streamArnParamRef,
                    },
                ],
            },
        ],
        dependsOn: [
            {
                category: 'analytics',
                resourceName: targetResourceName,
                attributes: ['kinesisStreamArn'],
            },
        ],
    };
}
exports.askAnalyticsCategoryKinesisQuestions = askAnalyticsCategoryKinesisQuestions;
//# sourceMappingURL=analyticsWalkthrough.js.map