import { $TSContext } from 'amplify-cli-core';
import { DynamoDBStreams, Endpoint } from 'aws-sdk';
import { invokeLambda } from './lambda-invoke';
import { isMockable } from 'amplify-category-function';
import { printer } from 'amplify-prompts';

/**
 * Asynchronous function that handles invoking the given lambda trigger function
 * when there are DynamoDB records available to be processed via DDB stream.
 * @param context The CLI context
 * @param streamArn ARN corresponding to the DDB stream to listen to
 * @param lambdaTriggerName Lambda function to trigger
 * @param localDynamoDBEndpoint Local DDB endpoint that was provisioned
 */
export const ddbLambdaTriggerHandler = async (
    context: $TSContext,
    streamArn?: string,
    lambdaTriggerName?: string,
    localDynamoDBEndpoint?: Endpoint
): Promise<void> => {
    if (!lambdaTriggerName) {
        throw new Error('Name of the lambda trigger function must be specified');
    }
    if (!streamArn) {
        throw new Error('Stream Arn must be specified');
    }
    if (!localDynamoDBEndpoint) {
        throw new Error('Local URL where DDB is running should be specified');
    }

    // Lambda functions with layers are not mockable
    const mockable = isMockable(context, lambdaTriggerName);
    if (!mockable.isMockable) {
        throw new Error(`Unable to mock ${lambdaTriggerName}. ${mockable.reason}`);
    }

    const streams = getDDBStreamsClient(localDynamoDBEndpoint);

    await pollDDBStreamAndInvokeLamba(context, streamArn, streams, lambdaTriggerName);
}

/**
 * Shards are ephemeral and last for ~15 mins after creation. This method fetches the latest Shard iterator.
 * @param streamArn DDB stream ARN
 * @param streams DDB streams client
 * @returns latest active shard iterator
 */
export const getLatestShardIterator = async (streamArn: string, streams: DynamoDBStreams): Promise<string> => {
    const stream = await streams
        .describeStream({ StreamArn: streamArn })
        .promise();

    if (!stream) {
        throw new Error(`Local DynamoDB stream with ARN ${streamArn} cannot be found`);
    }

    // Get the latest active shard
    const { ShardId: shardId } =
        stream.StreamDescription.Shards.filter(
            currentShard => isShardActive(currentShard)
        )[0] || {}

    if (!shardId) {
        throw new Error('There is no shard that is open');
    }

    const { ShardIterator: start } = await streams
        .getShardIterator({
            StreamArn: streamArn,
            ShardId: shardId,
            ShardIteratorType: DDBStreamsShardIteratorType.LATEST
        })
        .promise();
    
    return start;
}

enum DDBStreamsShardIteratorType {
    TRIM_HORIZON = 'TRIM_HORIZON',
    LATEST = 'LATEST',
    AT_SEQUENCE_NUMBER = 'AT_SEQUENCE_NUMBER',
    AFTER_SEQUENCE_NUMBER = 'AFTER_SEQUENCE_NUMBER'
}

const isShardActive = (shard: DynamoDBStreams.Shard): boolean => {
    return shard.SequenceNumberRange &&
        shard.SequenceNumberRange.StartingSequenceNumber &&
        !shard.SequenceNumberRange.EndingSequenceNumber
}

/**
 * Gets the latest available records from a stream. Refreshes the shard iterator if the shard has expired.
 * @param shardIterator current shard iterator
 * @param streamArn DDB stream ARN
 * @param streams DDB streams client
 * @returns latest available records from stream
 */
export const getStreamRecords = async (
    shardIterator: string, 
    streamArn: string, 
    streams: DynamoDBStreams
    ) => {
    const shardIteratorCopy = shardIterator;
    try {
        const data = await streams.getRecords({ ShardIterator: shardIteratorCopy }).promise();
        return { data: data, shardIterator: shardIteratorCopy };
    } catch (error) {
        printer.info('Re-Trying with a new shard');
        const latestShardIterator = await getLatestShardIterator(streamArn, streams);
        const data = await streams.getRecords({ ShardIterator: latestShardIterator }).promise();
        return { data: data, shardIterator: latestShardIterator };
    }
}

/**
 * Checks if there are any new DDB records available 
 * via stream to be processed in the trigger
 */
export const pollDDBStreamAndInvokeLamba = async(context: $TSContext, streamArn: string, streams: DynamoDBStreams, lambdaTriggerName: string) => {
    let shardIterator = await getLatestShardIterator(streamArn, streams);
    while (shardIterator) {
        await getStreamRecords(shardIterator, streamArn, streams).then( async (result) => {
            const data = result.data;
            shardIterator = result.shardIterator;

            if (data.Records.length) {
                // when the records are available to be processed, trigger the local lambda
                await invokeLambda(context, lambdaTriggerName, data).then( () => {
                    shardIterator = data.NextShardIterator;
                });
            }

            // The frequency of polling is 4 per second - same as the cloud
            await new Promise((resolve, reject) => setTimeout(resolve, 0.25 * 1000));
        });
    }
}

export const getDDBStreamsClient = (localDynamoDBEndpoint: Endpoint): DynamoDBStreams => {
    const MOCK_REGION = 'us-fake-1';
    const MOCK_ACCESS_KEY = 'fake';
    const MOCK_SECRET_ACCESS_KEY = 'fake';

    return new DynamoDBStreams({
        endpoint: localDynamoDBEndpoint,
        region: MOCK_REGION,
        accessKeyId: MOCK_ACCESS_KEY,
        secretAccessKey: MOCK_SECRET_ACCESS_KEY
    });
}