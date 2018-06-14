/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ElasticsearchDestinationConfiguration {
    BufferingHints: ElasticsearchBufferingHints
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions
    DomainARN: Value<string>
    IndexName: Value<string>
    IndexRotationPeriod: Value<string>
    ProcessingConfiguration?: ProcessingConfiguration
    RetryOptions: ElasticsearchRetryOptions
    RoleARN: Value<string>
    S3BackupMode: Value<string>
    S3Configuration: S3DestinationConfiguration
    TypeName: Value<string>

    constructor(properties: ElasticsearchDestinationConfiguration) {
        Object.assign(this, properties)
    }
}

export class ElasticsearchBufferingHints {
    IntervalInSeconds: Value<number>
    SizeInMBs: Value<number>

    constructor(properties: ElasticsearchBufferingHints) {
        Object.assign(this, properties)
    }
}

export class SplunkDestinationConfiguration {
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions
    HECAcknowledgmentTimeoutInSeconds?: Value<number>
    HECEndpoint: Value<string>
    HECEndpointType: Value<string>
    HECToken: Value<string>
    ProcessingConfiguration?: ProcessingConfiguration
    RetryOptions?: SplunkRetryOptions
    S3BackupMode?: Value<string>
    S3Configuration: S3DestinationConfiguration

    constructor(properties: SplunkDestinationConfiguration) {
        Object.assign(this, properties)
    }
}

export class EncryptionConfiguration {
    KMSEncryptionConfig?: KMSEncryptionConfig
    NoEncryptionConfig?: Value<string>

    constructor(properties: EncryptionConfiguration) {
        Object.assign(this, properties)
    }
}

export class CloudWatchLoggingOptions {
    Enabled?: Value<boolean>
    LogGroupName?: Value<string>
    LogStreamName?: Value<string>

    constructor(properties: CloudWatchLoggingOptions) {
        Object.assign(this, properties)
    }
}

export class ProcessingConfiguration {
    Enabled?: Value<boolean>
    Processors?: List<Processor>

    constructor(properties: ProcessingConfiguration) {
        Object.assign(this, properties)
    }
}

export class BufferingHints {
    IntervalInSeconds: Value<number>
    SizeInMBs: Value<number>

    constructor(properties: BufferingHints) {
        Object.assign(this, properties)
    }
}

export class SplunkRetryOptions {
    DurationInSeconds: Value<number>

    constructor(properties: SplunkRetryOptions) {
        Object.assign(this, properties)
    }
}

export class KinesisStreamSourceConfiguration {
    KinesisStreamARN: Value<string>
    RoleARN: Value<string>

    constructor(properties: KinesisStreamSourceConfiguration) {
        Object.assign(this, properties)
    }
}

export class ProcessorParameter {
    ParameterName: Value<string>
    ParameterValue: Value<string>

    constructor(properties: ProcessorParameter) {
        Object.assign(this, properties)
    }
}

export class Processor {
    Parameters: List<ProcessorParameter>
    Type: Value<string>

    constructor(properties: Processor) {
        Object.assign(this, properties)
    }
}

export class CopyCommand {
    CopyOptions?: Value<string>
    DataTableColumns?: Value<string>
    DataTableName: Value<string>

    constructor(properties: CopyCommand) {
        Object.assign(this, properties)
    }
}

export class S3DestinationConfiguration {
    BucketARN: Value<string>
    BufferingHints: BufferingHints
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions
    CompressionFormat: Value<string>
    EncryptionConfiguration?: EncryptionConfiguration
    Prefix?: Value<string>
    RoleARN: Value<string>

    constructor(properties: S3DestinationConfiguration) {
        Object.assign(this, properties)
    }
}

export class ElasticsearchRetryOptions {
    DurationInSeconds: Value<number>

    constructor(properties: ElasticsearchRetryOptions) {
        Object.assign(this, properties)
    }
}

export class KMSEncryptionConfig {
    AWSKMSKeyARN: Value<string>

    constructor(properties: KMSEncryptionConfig) {
        Object.assign(this, properties)
    }
}

export class ExtendedS3DestinationConfiguration {
    BucketARN: Value<string>
    BufferingHints: BufferingHints
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions
    CompressionFormat: Value<string>
    EncryptionConfiguration?: EncryptionConfiguration
    Prefix: Value<string>
    ProcessingConfiguration?: ProcessingConfiguration
    RoleARN: Value<string>
    S3BackupConfiguration?: S3DestinationConfiguration
    S3BackupMode?: Value<string>

    constructor(properties: ExtendedS3DestinationConfiguration) {
        Object.assign(this, properties)
    }
}

export class RedshiftDestinationConfiguration {
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions
    ClusterJDBCURL: Value<string>
    CopyCommand: CopyCommand
    Password: Value<string>
    ProcessingConfiguration?: ProcessingConfiguration
    RoleARN: Value<string>
    S3Configuration: S3DestinationConfiguration
    Username: Value<string>

    constructor(properties: RedshiftDestinationConfiguration) {
        Object.assign(this, properties)
    }
}

export interface DeliveryStreamProperties {
    DeliveryStreamName?: Value<string>
    DeliveryStreamType?: Value<string>
    ElasticsearchDestinationConfiguration?: ElasticsearchDestinationConfiguration
    ExtendedS3DestinationConfiguration?: ExtendedS3DestinationConfiguration
    KinesisStreamSourceConfiguration?: KinesisStreamSourceConfiguration
    RedshiftDestinationConfiguration?: RedshiftDestinationConfiguration
    S3DestinationConfiguration?: S3DestinationConfiguration
    SplunkDestinationConfiguration?: SplunkDestinationConfiguration
}

export default class DeliveryStream extends ResourceBase {
    static ElasticsearchDestinationConfiguration = ElasticsearchDestinationConfiguration
    static ElasticsearchBufferingHints = ElasticsearchBufferingHints
    static SplunkDestinationConfiguration = SplunkDestinationConfiguration
    static EncryptionConfiguration = EncryptionConfiguration
    static CloudWatchLoggingOptions = CloudWatchLoggingOptions
    static ProcessingConfiguration = ProcessingConfiguration
    static BufferingHints = BufferingHints
    static SplunkRetryOptions = SplunkRetryOptions
    static KinesisStreamSourceConfiguration = KinesisStreamSourceConfiguration
    static ProcessorParameter = ProcessorParameter
    static Processor = Processor
    static CopyCommand = CopyCommand
    static S3DestinationConfiguration = S3DestinationConfiguration
    static ElasticsearchRetryOptions = ElasticsearchRetryOptions
    static KMSEncryptionConfig = KMSEncryptionConfig
    static ExtendedS3DestinationConfiguration = ExtendedS3DestinationConfiguration
    static RedshiftDestinationConfiguration = RedshiftDestinationConfiguration

    constructor(properties?: DeliveryStreamProperties) {
        super('AWS::KinesisFirehose::DeliveryStream', properties)
    }
}
