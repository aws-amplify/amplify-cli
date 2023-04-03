"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDDBStreamsClient = exports.pollDDBStreamAndInvokeLambda = exports.getStreamRecords = exports.getLatestShardIterator = exports.ddbLambdaTriggerHandler = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_sdk_1 = require("aws-sdk");
const lambda_invoke_1 = require("./lambda-invoke");
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const ddbLambdaTriggerHandler = async (context, streamArn, lambdaTrigger, localDynamoDBEndpoint) => {
    if (!lambdaTrigger || (!(lambdaTrigger === null || lambdaTrigger === void 0 ? void 0 : lambdaTrigger.name) && !(lambdaTrigger === null || lambdaTrigger === void 0 ? void 0 : lambdaTrigger.config))) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'Lambda trigger must be specified',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    if (!streamArn) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'Stream Arn must be specified',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    if (!localDynamoDBEndpoint) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'Local URL where DDB is running should be specified',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    if (lambdaTrigger === null || lambdaTrigger === void 0 ? void 0 : lambdaTrigger.name) {
        const mockable = (0, amplify_category_function_1.isMockable)(context, lambdaTrigger === null || lambdaTrigger === void 0 ? void 0 : lambdaTrigger.name);
        if (!mockable.isMockable) {
            throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
                message: `Unable to mock ${lambdaTrigger === null || lambdaTrigger === void 0 ? void 0 : lambdaTrigger.name}. ${mockable.reason}`,
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
    }
    const streams = (0, exports.getDDBStreamsClient)(localDynamoDBEndpoint);
    await (0, exports.pollDDBStreamAndInvokeLambda)(context, streamArn, streams, lambdaTrigger);
};
exports.ddbLambdaTriggerHandler = ddbLambdaTriggerHandler;
const getLatestShardIterator = async (streamArn, streams) => {
    const stream = await streams.describeStream({ StreamArn: streamArn }).promise();
    if (!stream) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: `Local DynamoDB stream with ARN ${streamArn} cannot be found`,
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    const { ShardId: shardId } = stream.StreamDescription.Shards.filter((currentShard) => isShardActive(currentShard))[0] || {};
    if (!shardId) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'There is no shard that is open',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    const { ShardIterator: start } = await streams
        .getShardIterator({
        StreamArn: streamArn,
        ShardId: shardId,
        ShardIteratorType: DDBStreamsShardIteratorType.LATEST,
    })
        .promise();
    return start;
};
exports.getLatestShardIterator = getLatestShardIterator;
var DDBStreamsShardIteratorType;
(function (DDBStreamsShardIteratorType) {
    DDBStreamsShardIteratorType["TRIM_HORIZON"] = "TRIM_HORIZON";
    DDBStreamsShardIteratorType["LATEST"] = "LATEST";
    DDBStreamsShardIteratorType["AT_SEQUENCE_NUMBER"] = "AT_SEQUENCE_NUMBER";
    DDBStreamsShardIteratorType["AFTER_SEQUENCE_NUMBER"] = "AFTER_SEQUENCE_NUMBER";
})(DDBStreamsShardIteratorType || (DDBStreamsShardIteratorType = {}));
const isShardActive = (shard) => {
    return shard.SequenceNumberRange && shard.SequenceNumberRange.StartingSequenceNumber && !shard.SequenceNumberRange.EndingSequenceNumber;
};
const getStreamRecords = async (shardIterator, streamArn, streams) => {
    const shardIteratorCopy = shardIterator;
    try {
        const data = await streams.getRecords({ ShardIterator: shardIteratorCopy }).promise();
        return { data: data, shardIterator: shardIteratorCopy };
    }
    catch (error) {
        amplify_prompts_1.printer.info('Re-Trying with a new shard');
        const latestShardIterator = await (0, exports.getLatestShardIterator)(streamArn, streams);
        const data = await streams.getRecords({ ShardIterator: latestShardIterator }).promise();
        return { data: data, shardIterator: latestShardIterator };
    }
};
exports.getStreamRecords = getStreamRecords;
const pollDDBStreamAndInvokeLambda = async (context, streamArn, streams, lambdaTrigger) => {
    let shardIterator = await (0, exports.getLatestShardIterator)(streamArn, streams);
    while (shardIterator) {
        await (0, exports.getStreamRecords)(shardIterator, streamArn, streams).then(async (result) => {
            const data = result.data;
            shardIterator = result.shardIterator;
            if (data.Records.length) {
                await (0, lambda_invoke_1.invokeTrigger)(context, lambdaTrigger, data).then(() => {
                    shardIterator = data.NextShardIterator;
                });
            }
            await new Promise((resolve) => setTimeout(resolve, 0.25 * 1000));
        });
    }
};
exports.pollDDBStreamAndInvokeLambda = pollDDBStreamAndInvokeLambda;
const getDDBStreamsClient = (localDynamoDBEndpoint) => {
    const MOCK_REGION = 'us-fake-1';
    const MOCK_ACCESS_KEY = 'fake';
    const MOCK_SECRET_ACCESS_KEY = 'fake';
    return new aws_sdk_1.DynamoDBStreams({
        endpoint: localDynamoDBEndpoint,
        region: MOCK_REGION,
        accessKeyId: MOCK_ACCESS_KEY,
        secretAccessKey: MOCK_SECRET_ACCESS_KEY,
    });
};
exports.getDDBStreamsClient = getDDBStreamsClient;
//# sourceMappingURL=lambda-trigger-handler.js.map