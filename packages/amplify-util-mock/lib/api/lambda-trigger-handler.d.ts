import { $TSContext } from 'amplify-cli-core';
import { DynamoDBStreams, Endpoint } from 'aws-sdk';
import { LambdaTrigger } from '../utils/lambda/find-lambda-triggers';
export declare const ddbLambdaTriggerHandler: (context: $TSContext, streamArn?: string, lambdaTrigger?: LambdaTrigger, localDynamoDBEndpoint?: Endpoint) => Promise<void>;
export declare const getLatestShardIterator: (streamArn: string, streams: DynamoDBStreams) => Promise<string>;
export declare const getStreamRecords: (shardIterator: string, streamArn: string, streams: DynamoDBStreams) => Promise<{
    data: import("aws-sdk/lib/request").PromiseResult<DynamoDBStreams.GetRecordsOutput, import("aws-sdk").AWSError>;
    shardIterator: string;
}>;
export declare const pollDDBStreamAndInvokeLambda: (context: $TSContext, streamArn: string, streams: DynamoDBStreams, lambdaTrigger: LambdaTrigger) => Promise<void>;
export declare const getDDBStreamsClient: (localDynamoDBEndpoint: Endpoint) => DynamoDBStreams;
//# sourceMappingURL=lambda-trigger-handler.d.ts.map