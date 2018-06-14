import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class S3Action {
    BucketName: Value<string>;
    Key: Value<string>;
    RoleArn: Value<string>;
    constructor(properties: S3Action);
}
export declare class SqsAction {
    QueueUrl: Value<string>;
    RoleArn: Value<string>;
    UseBase64?: Value<boolean>;
    constructor(properties: SqsAction);
}
export declare class PutItemInput {
    TableName: Value<string>;
    constructor(properties: PutItemInput);
}
export declare class RepublishAction {
    RoleArn: Value<string>;
    Topic: Value<string>;
    constructor(properties: RepublishAction);
}
export declare class SnsAction {
    MessageFormat?: Value<string>;
    RoleArn: Value<string>;
    TargetArn: Value<string>;
    constructor(properties: SnsAction);
}
export declare class FirehoseAction {
    DeliveryStreamName: Value<string>;
    RoleArn: Value<string>;
    Separator?: Value<string>;
    constructor(properties: FirehoseAction);
}
export declare class TopicRulePayload {
    Actions: List<Action>;
    AwsIotSqlVersion?: Value<string>;
    Description?: Value<string>;
    RuleDisabled: Value<boolean>;
    Sql: Value<string>;
    constructor(properties: TopicRulePayload);
}
export declare class LambdaAction {
    FunctionArn?: Value<string>;
    constructor(properties: LambdaAction);
}
export declare class DynamoDBv2Action {
    PutItem?: PutItemInput;
    RoleArn?: Value<string>;
    constructor(properties: DynamoDBv2Action);
}
export declare class ElasticsearchAction {
    Endpoint: Value<string>;
    Id: Value<string>;
    Index: Value<string>;
    RoleArn: Value<string>;
    Type: Value<string>;
    constructor(properties: ElasticsearchAction);
}
export declare class DynamoDBAction {
    HashKeyField: Value<string>;
    HashKeyType?: Value<string>;
    HashKeyValue: Value<string>;
    PayloadField?: Value<string>;
    RangeKeyField?: Value<string>;
    RangeKeyType?: Value<string>;
    RangeKeyValue?: Value<string>;
    RoleArn: Value<string>;
    TableName: Value<string>;
    constructor(properties: DynamoDBAction);
}
export declare class KinesisAction {
    PartitionKey?: Value<string>;
    RoleArn: Value<string>;
    StreamName: Value<string>;
    constructor(properties: KinesisAction);
}
export declare class CloudwatchAlarmAction {
    AlarmName: Value<string>;
    RoleArn: Value<string>;
    StateReason: Value<string>;
    StateValue: Value<string>;
    constructor(properties: CloudwatchAlarmAction);
}
export declare class Action {
    CloudwatchAlarm?: CloudwatchAlarmAction;
    CloudwatchMetric?: CloudwatchMetricAction;
    DynamoDB?: DynamoDBAction;
    DynamoDBv2?: DynamoDBv2Action;
    Elasticsearch?: ElasticsearchAction;
    Firehose?: FirehoseAction;
    Kinesis?: KinesisAction;
    Lambda?: LambdaAction;
    Republish?: RepublishAction;
    S3?: S3Action;
    Sns?: SnsAction;
    Sqs?: SqsAction;
    constructor(properties: Action);
}
export declare class CloudwatchMetricAction {
    MetricName: Value<string>;
    MetricNamespace: Value<string>;
    MetricTimestamp?: Value<string>;
    MetricUnit: Value<string>;
    MetricValue: Value<string>;
    RoleArn: Value<string>;
    constructor(properties: CloudwatchMetricAction);
}
export interface TopicRuleProperties {
    RuleName?: Value<string>;
    TopicRulePayload: TopicRulePayload;
}
export default class TopicRule extends ResourceBase {
    static S3Action: typeof S3Action;
    static SqsAction: typeof SqsAction;
    static PutItemInput: typeof PutItemInput;
    static RepublishAction: typeof RepublishAction;
    static SnsAction: typeof SnsAction;
    static FirehoseAction: typeof FirehoseAction;
    static TopicRulePayload: typeof TopicRulePayload;
    static LambdaAction: typeof LambdaAction;
    static DynamoDBv2Action: typeof DynamoDBv2Action;
    static ElasticsearchAction: typeof ElasticsearchAction;
    static DynamoDBAction: typeof DynamoDBAction;
    static KinesisAction: typeof KinesisAction;
    static CloudwatchAlarmAction: typeof CloudwatchAlarmAction;
    static Action: typeof Action;
    static CloudwatchMetricAction: typeof CloudwatchMetricAction;
    constructor(properties?: TopicRuleProperties);
}
