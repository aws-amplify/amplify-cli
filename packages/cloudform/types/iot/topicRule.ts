/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class S3Action {
    BucketName: Value<string>
    Key: Value<string>
    RoleArn: Value<string>

    constructor(properties: S3Action) {
        Object.assign(this, properties)
    }
}

export class SqsAction {
    QueueUrl: Value<string>
    RoleArn: Value<string>
    UseBase64?: Value<boolean>

    constructor(properties: SqsAction) {
        Object.assign(this, properties)
    }
}

export class PutItemInput {
    TableName: Value<string>

    constructor(properties: PutItemInput) {
        Object.assign(this, properties)
    }
}

export class RepublishAction {
    RoleArn: Value<string>
    Topic: Value<string>

    constructor(properties: RepublishAction) {
        Object.assign(this, properties)
    }
}

export class SnsAction {
    MessageFormat?: Value<string>
    RoleArn: Value<string>
    TargetArn: Value<string>

    constructor(properties: SnsAction) {
        Object.assign(this, properties)
    }
}

export class FirehoseAction {
    DeliveryStreamName: Value<string>
    RoleArn: Value<string>
    Separator?: Value<string>

    constructor(properties: FirehoseAction) {
        Object.assign(this, properties)
    }
}

export class TopicRulePayload {
    Actions: List<Action>
    AwsIotSqlVersion?: Value<string>
    Description?: Value<string>
    RuleDisabled: Value<boolean>
    Sql: Value<string>

    constructor(properties: TopicRulePayload) {
        Object.assign(this, properties)
    }
}

export class LambdaAction {
    FunctionArn?: Value<string>

    constructor(properties: LambdaAction) {
        Object.assign(this, properties)
    }
}

export class DynamoDBv2Action {
    PutItem?: PutItemInput
    RoleArn?: Value<string>

    constructor(properties: DynamoDBv2Action) {
        Object.assign(this, properties)
    }
}

export class ElasticsearchAction {
    Endpoint: Value<string>
    Id: Value<string>
    Index: Value<string>
    RoleArn: Value<string>
    Type: Value<string>

    constructor(properties: ElasticsearchAction) {
        Object.assign(this, properties)
    }
}

export class DynamoDBAction {
    HashKeyField: Value<string>
    HashKeyType?: Value<string>
    HashKeyValue: Value<string>
    PayloadField?: Value<string>
    RangeKeyField?: Value<string>
    RangeKeyType?: Value<string>
    RangeKeyValue?: Value<string>
    RoleArn: Value<string>
    TableName: Value<string>

    constructor(properties: DynamoDBAction) {
        Object.assign(this, properties)
    }
}

export class KinesisAction {
    PartitionKey?: Value<string>
    RoleArn: Value<string>
    StreamName: Value<string>

    constructor(properties: KinesisAction) {
        Object.assign(this, properties)
    }
}

export class CloudwatchAlarmAction {
    AlarmName: Value<string>
    RoleArn: Value<string>
    StateReason: Value<string>
    StateValue: Value<string>

    constructor(properties: CloudwatchAlarmAction) {
        Object.assign(this, properties)
    }
}

export class Action {
    CloudwatchAlarm?: CloudwatchAlarmAction
    CloudwatchMetric?: CloudwatchMetricAction
    DynamoDB?: DynamoDBAction
    DynamoDBv2?: DynamoDBv2Action
    Elasticsearch?: ElasticsearchAction
    Firehose?: FirehoseAction
    Kinesis?: KinesisAction
    Lambda?: LambdaAction
    Republish?: RepublishAction
    S3?: S3Action
    Sns?: SnsAction
    Sqs?: SqsAction

    constructor(properties: Action) {
        Object.assign(this, properties)
    }
}

export class CloudwatchMetricAction {
    MetricName: Value<string>
    MetricNamespace: Value<string>
    MetricTimestamp?: Value<string>
    MetricUnit: Value<string>
    MetricValue: Value<string>
    RoleArn: Value<string>

    constructor(properties: CloudwatchMetricAction) {
        Object.assign(this, properties)
    }
}

export interface TopicRuleProperties {
    RuleName?: Value<string>
    TopicRulePayload: TopicRulePayload
}

export default class TopicRule extends ResourceBase {
    static S3Action = S3Action
    static SqsAction = SqsAction
    static PutItemInput = PutItemInput
    static RepublishAction = RepublishAction
    static SnsAction = SnsAction
    static FirehoseAction = FirehoseAction
    static TopicRulePayload = TopicRulePayload
    static LambdaAction = LambdaAction
    static DynamoDBv2Action = DynamoDBv2Action
    static ElasticsearchAction = ElasticsearchAction
    static DynamoDBAction = DynamoDBAction
    static KinesisAction = KinesisAction
    static CloudwatchAlarmAction = CloudwatchAlarmAction
    static Action = Action
    static CloudwatchMetricAction = CloudwatchMetricAction

    constructor(properties?: TopicRuleProperties) {
        super('AWS::IoT::TopicRule', properties)
    }
}
