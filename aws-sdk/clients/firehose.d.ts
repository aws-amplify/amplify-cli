import {Request} from '../lib/request';
import {Response} from '../lib/response';
import {AWSError} from '../lib/error';
import {Service} from '../lib/service';
import {ServiceConfigurationOptions} from '../lib/service';
import {ConfigBase as Config} from '../lib/config';
interface Blob {}
declare class Firehose extends Service {
  /**
   * Constructs a service object. This object has one method for each API operation.
   */
  constructor(options?: Firehose.Types.ClientConfiguration)
  config: Config & Firehose.Types.ClientConfiguration;
  /**
   * Creates a Kinesis Data Firehose delivery stream. By default, you can create up to 50 delivery streams per AWS Region. This is an asynchronous operation that immediately returns. The initial status of the delivery stream is CREATING. After the delivery stream is created, its status is ACTIVE and it now accepts data. Attempts to send data to a delivery stream that is not in the ACTIVE state cause an exception. To check the state of a delivery stream, use DescribeDeliveryStream. A Kinesis Data Firehose delivery stream can be configured to receive records directly from providers using PutRecord or PutRecordBatch, or it can be configured to use an existing Kinesis stream as its source. To specify a Kinesis data stream as input, set the DeliveryStreamType parameter to KinesisStreamAsSource, and provide the Kinesis stream Amazon Resource Name (ARN) and role ARN in the KinesisStreamSourceConfiguration parameter. A delivery stream is configured with a single destination: Amazon S3, Amazon ES, Amazon Redshift, or Splunk. You must specify only one of the following destination configuration parameters: ExtendedS3DestinationConfiguration, S3DestinationConfiguration, ElasticsearchDestinationConfiguration, RedshiftDestinationConfiguration, or SplunkDestinationConfiguration. When you specify S3DestinationConfiguration, you can also provide the following optional values: BufferingHints, EncryptionConfiguration, and CompressionFormat. By default, if no BufferingHints value is provided, Kinesis Data Firehose buffers data up to 5 MB or for 5 minutes, whichever condition is satisfied first. BufferingHints is a hint, so there are some cases where the service cannot adhere to these conditions strictly. For example, record boundaries might be such that the size is a little over or under the configured buffering size. By default, no encryption is performed. We strongly recommend that you enable encryption to ensure secure data storage in Amazon S3. A few notes about Amazon Redshift as a destination:   An Amazon Redshift destination requires an S3 bucket as intermediate location. Kinesis Data Firehose first delivers data to Amazon S3 and then uses COPY syntax to load data into an Amazon Redshift table. This is specified in the RedshiftDestinationConfiguration.S3Configuration parameter.   The compression formats SNAPPY or ZIP cannot be specified in RedshiftDestinationConfiguration.S3Configuration because the Amazon Redshift COPY operation that reads from the S3 bucket doesn't support these compression formats.   We strongly recommend that you use the user name and password you provide exclusively with Kinesis Data Firehose, and that the permissions for the account are restricted for Amazon Redshift INSERT permissions.   Kinesis Data Firehose assumes the IAM role that is configured as part of the destination. The role should allow the Kinesis Data Firehose principal to assume the role, and the role should have permissions that allow the service to deliver the data. For more information, see Grant Kinesis Data Firehose Access to an Amazon S3 Destination in the Amazon Kinesis Data Firehose Developer Guide.
   */
  createDeliveryStream(params: Firehose.Types.CreateDeliveryStreamInput, callback?: (err: AWSError, data: Firehose.Types.CreateDeliveryStreamOutput) => void): Request<Firehose.Types.CreateDeliveryStreamOutput, AWSError>;
  /**
   * Creates a Kinesis Data Firehose delivery stream. By default, you can create up to 50 delivery streams per AWS Region. This is an asynchronous operation that immediately returns. The initial status of the delivery stream is CREATING. After the delivery stream is created, its status is ACTIVE and it now accepts data. Attempts to send data to a delivery stream that is not in the ACTIVE state cause an exception. To check the state of a delivery stream, use DescribeDeliveryStream. A Kinesis Data Firehose delivery stream can be configured to receive records directly from providers using PutRecord or PutRecordBatch, or it can be configured to use an existing Kinesis stream as its source. To specify a Kinesis data stream as input, set the DeliveryStreamType parameter to KinesisStreamAsSource, and provide the Kinesis stream Amazon Resource Name (ARN) and role ARN in the KinesisStreamSourceConfiguration parameter. A delivery stream is configured with a single destination: Amazon S3, Amazon ES, Amazon Redshift, or Splunk. You must specify only one of the following destination configuration parameters: ExtendedS3DestinationConfiguration, S3DestinationConfiguration, ElasticsearchDestinationConfiguration, RedshiftDestinationConfiguration, or SplunkDestinationConfiguration. When you specify S3DestinationConfiguration, you can also provide the following optional values: BufferingHints, EncryptionConfiguration, and CompressionFormat. By default, if no BufferingHints value is provided, Kinesis Data Firehose buffers data up to 5 MB or for 5 minutes, whichever condition is satisfied first. BufferingHints is a hint, so there are some cases where the service cannot adhere to these conditions strictly. For example, record boundaries might be such that the size is a little over or under the configured buffering size. By default, no encryption is performed. We strongly recommend that you enable encryption to ensure secure data storage in Amazon S3. A few notes about Amazon Redshift as a destination:   An Amazon Redshift destination requires an S3 bucket as intermediate location. Kinesis Data Firehose first delivers data to Amazon S3 and then uses COPY syntax to load data into an Amazon Redshift table. This is specified in the RedshiftDestinationConfiguration.S3Configuration parameter.   The compression formats SNAPPY or ZIP cannot be specified in RedshiftDestinationConfiguration.S3Configuration because the Amazon Redshift COPY operation that reads from the S3 bucket doesn't support these compression formats.   We strongly recommend that you use the user name and password you provide exclusively with Kinesis Data Firehose, and that the permissions for the account are restricted for Amazon Redshift INSERT permissions.   Kinesis Data Firehose assumes the IAM role that is configured as part of the destination. The role should allow the Kinesis Data Firehose principal to assume the role, and the role should have permissions that allow the service to deliver the data. For more information, see Grant Kinesis Data Firehose Access to an Amazon S3 Destination in the Amazon Kinesis Data Firehose Developer Guide.
   */
  createDeliveryStream(callback?: (err: AWSError, data: Firehose.Types.CreateDeliveryStreamOutput) => void): Request<Firehose.Types.CreateDeliveryStreamOutput, AWSError>;
  /**
   * Deletes a delivery stream and its data. You can delete a delivery stream only if it is in ACTIVE or DELETING state, and not in the CREATING state. While the deletion request is in process, the delivery stream is in the DELETING state. To check the state of a delivery stream, use DescribeDeliveryStream. While the delivery stream is DELETING state, the service might continue to accept the records, but it doesn't make any guarantees with respect to delivering the data. Therefore, as a best practice, you should first stop any applications that are sending records before deleting a delivery stream.
   */
  deleteDeliveryStream(params: Firehose.Types.DeleteDeliveryStreamInput, callback?: (err: AWSError, data: Firehose.Types.DeleteDeliveryStreamOutput) => void): Request<Firehose.Types.DeleteDeliveryStreamOutput, AWSError>;
  /**
   * Deletes a delivery stream and its data. You can delete a delivery stream only if it is in ACTIVE or DELETING state, and not in the CREATING state. While the deletion request is in process, the delivery stream is in the DELETING state. To check the state of a delivery stream, use DescribeDeliveryStream. While the delivery stream is DELETING state, the service might continue to accept the records, but it doesn't make any guarantees with respect to delivering the data. Therefore, as a best practice, you should first stop any applications that are sending records before deleting a delivery stream.
   */
  deleteDeliveryStream(callback?: (err: AWSError, data: Firehose.Types.DeleteDeliveryStreamOutput) => void): Request<Firehose.Types.DeleteDeliveryStreamOutput, AWSError>;
  /**
   * Describes the specified delivery stream and gets the status. For example, after your delivery stream is created, call DescribeDeliveryStream to see whether the delivery stream is ACTIVE and therefore ready for data to be sent to it.
   */
  describeDeliveryStream(params: Firehose.Types.DescribeDeliveryStreamInput, callback?: (err: AWSError, data: Firehose.Types.DescribeDeliveryStreamOutput) => void): Request<Firehose.Types.DescribeDeliveryStreamOutput, AWSError>;
  /**
   * Describes the specified delivery stream and gets the status. For example, after your delivery stream is created, call DescribeDeliveryStream to see whether the delivery stream is ACTIVE and therefore ready for data to be sent to it.
   */
  describeDeliveryStream(callback?: (err: AWSError, data: Firehose.Types.DescribeDeliveryStreamOutput) => void): Request<Firehose.Types.DescribeDeliveryStreamOutput, AWSError>;
  /**
   * Lists your delivery streams. The number of delivery streams might be too large to return using a single call to ListDeliveryStreams. You can limit the number of delivery streams returned, using the Limit parameter. To determine whether there are more delivery streams to list, check the value of HasMoreDeliveryStreams in the output. If there are more delivery streams to list, you can request them by specifying the name of the last delivery stream returned in the call in the ExclusiveStartDeliveryStreamName parameter of a subsequent call.
   */
  listDeliveryStreams(params: Firehose.Types.ListDeliveryStreamsInput, callback?: (err: AWSError, data: Firehose.Types.ListDeliveryStreamsOutput) => void): Request<Firehose.Types.ListDeliveryStreamsOutput, AWSError>;
  /**
   * Lists your delivery streams. The number of delivery streams might be too large to return using a single call to ListDeliveryStreams. You can limit the number of delivery streams returned, using the Limit parameter. To determine whether there are more delivery streams to list, check the value of HasMoreDeliveryStreams in the output. If there are more delivery streams to list, you can request them by specifying the name of the last delivery stream returned in the call in the ExclusiveStartDeliveryStreamName parameter of a subsequent call.
   */
  listDeliveryStreams(callback?: (err: AWSError, data: Firehose.Types.ListDeliveryStreamsOutput) => void): Request<Firehose.Types.ListDeliveryStreamsOutput, AWSError>;
  /**
   * Lists the tags for the specified delivery stream. This operation has a limit of five transactions per second per account. 
   */
  listTagsForDeliveryStream(params: Firehose.Types.ListTagsForDeliveryStreamInput, callback?: (err: AWSError, data: Firehose.Types.ListTagsForDeliveryStreamOutput) => void): Request<Firehose.Types.ListTagsForDeliveryStreamOutput, AWSError>;
  /**
   * Lists the tags for the specified delivery stream. This operation has a limit of five transactions per second per account. 
   */
  listTagsForDeliveryStream(callback?: (err: AWSError, data: Firehose.Types.ListTagsForDeliveryStreamOutput) => void): Request<Firehose.Types.ListTagsForDeliveryStreamOutput, AWSError>;
  /**
   * Writes a single data record into an Amazon Kinesis Data Firehose delivery stream. To write multiple data records into a delivery stream, use PutRecordBatch. Applications using these operations are referred to as producers. By default, each delivery stream can take in up to 2,000 transactions per second, 5,000 records per second, or 5 MB per second. If you use PutRecord and PutRecordBatch, the limits are an aggregate across these two operations for each delivery stream. For more information about limits and how to request an increase, see Amazon Kinesis Data Firehose Limits.  You must specify the name of the delivery stream and the data record when using PutRecord. The data record consists of a data blob that can be up to 1,000 KB in size, and any kind of data. For example, it can be a segment from a log file, geographic location data, website clickstream data, and so on. Kinesis Data Firehose buffers records before delivering them to the destination. To disambiguate the data blobs at the destination, a common solution is to use delimiters in the data, such as a newline (\n) or some other character unique within the data. This allows the consumer application to parse individual data items when reading the data from the destination. The PutRecord operation returns a RecordId, which is a unique string assigned to each record. Producer applications can use this ID for purposes such as auditability and investigation. If the PutRecord operation throws a ServiceUnavailableException, back off and retry. If the exception persists, it is possible that the throughput limits have been exceeded for the delivery stream.  Data records sent to Kinesis Data Firehose are stored for 24 hours from the time they are added to a delivery stream as it tries to send the records to the destination. If the destination is unreachable for more than 24 hours, the data is no longer available.
   */
  putRecord(params: Firehose.Types.PutRecordInput, callback?: (err: AWSError, data: Firehose.Types.PutRecordOutput) => void): Request<Firehose.Types.PutRecordOutput, AWSError>;
  /**
   * Writes a single data record into an Amazon Kinesis Data Firehose delivery stream. To write multiple data records into a delivery stream, use PutRecordBatch. Applications using these operations are referred to as producers. By default, each delivery stream can take in up to 2,000 transactions per second, 5,000 records per second, or 5 MB per second. If you use PutRecord and PutRecordBatch, the limits are an aggregate across these two operations for each delivery stream. For more information about limits and how to request an increase, see Amazon Kinesis Data Firehose Limits.  You must specify the name of the delivery stream and the data record when using PutRecord. The data record consists of a data blob that can be up to 1,000 KB in size, and any kind of data. For example, it can be a segment from a log file, geographic location data, website clickstream data, and so on. Kinesis Data Firehose buffers records before delivering them to the destination. To disambiguate the data blobs at the destination, a common solution is to use delimiters in the data, such as a newline (\n) or some other character unique within the data. This allows the consumer application to parse individual data items when reading the data from the destination. The PutRecord operation returns a RecordId, which is a unique string assigned to each record. Producer applications can use this ID for purposes such as auditability and investigation. If the PutRecord operation throws a ServiceUnavailableException, back off and retry. If the exception persists, it is possible that the throughput limits have been exceeded for the delivery stream.  Data records sent to Kinesis Data Firehose are stored for 24 hours from the time they are added to a delivery stream as it tries to send the records to the destination. If the destination is unreachable for more than 24 hours, the data is no longer available.
   */
  putRecord(callback?: (err: AWSError, data: Firehose.Types.PutRecordOutput) => void): Request<Firehose.Types.PutRecordOutput, AWSError>;
  /**
   * Writes multiple data records into a delivery stream in a single call, which can achieve higher throughput per producer than when writing single records. To write single data records into a delivery stream, use PutRecord. Applications using these operations are referred to as producers. By default, each delivery stream can take in up to 2,000 transactions per second, 5,000 records per second, or 5 MB per second. If you use PutRecord and PutRecordBatch, the limits are an aggregate across these two operations for each delivery stream. For more information about limits, see Amazon Kinesis Data Firehose Limits. Each PutRecordBatch request supports up to 500 records. Each record in the request can be as large as 1,000 KB (before 64-bit encoding), up to a limit of 4 MB for the entire request. These limits cannot be changed. You must specify the name of the delivery stream and the data record when using PutRecord. The data record consists of a data blob that can be up to 1,000 KB in size, and any kind of data. For example, it could be a segment from a log file, geographic location data, website clickstream data, and so on. Kinesis Data Firehose buffers records before delivering them to the destination. To disambiguate the data blobs at the destination, a common solution is to use delimiters in the data, such as a newline (\n) or some other character unique within the data. This allows the consumer application to parse individual data items when reading the data from the destination. The PutRecordBatch response includes a count of failed records, FailedPutCount, and an array of responses, RequestResponses. Each entry in the RequestResponses array provides additional information about the processed record. It directly correlates with a record in the request array using the same ordering, from the top to the bottom. The response array always includes the same number of records as the request array. RequestResponses includes both successfully and unsuccessfully processed records. Kinesis Data Firehose tries to process all records in each PutRecordBatch request. A single record failure does not stop the processing of subsequent records. A successfully processed record includes a RecordId value, which is unique for the record. An unsuccessfully processed record includes ErrorCode and ErrorMessage values. ErrorCode reflects the type of error, and is one of the following values: ServiceUnavailable or InternalFailure. ErrorMessage provides more detailed information about the error. If there is an internal server error or a timeout, the write might have completed or it might have failed. If FailedPutCount is greater than 0, retry the request, resending only those records that might have failed processing. This minimizes the possible duplicate records and also reduces the total bytes sent (and corresponding charges). We recommend that you handle any duplicates at the destination. If PutRecordBatch throws ServiceUnavailableException, back off and retry. If the exception persists, it is possible that the throughput limits have been exceeded for the delivery stream. Data records sent to Kinesis Data Firehose are stored for 24 hours from the time they are added to a delivery stream as it attempts to send the records to the destination. If the destination is unreachable for more than 24 hours, the data is no longer available.
   */
  putRecordBatch(params: Firehose.Types.PutRecordBatchInput, callback?: (err: AWSError, data: Firehose.Types.PutRecordBatchOutput) => void): Request<Firehose.Types.PutRecordBatchOutput, AWSError>;
  /**
   * Writes multiple data records into a delivery stream in a single call, which can achieve higher throughput per producer than when writing single records. To write single data records into a delivery stream, use PutRecord. Applications using these operations are referred to as producers. By default, each delivery stream can take in up to 2,000 transactions per second, 5,000 records per second, or 5 MB per second. If you use PutRecord and PutRecordBatch, the limits are an aggregate across these two operations for each delivery stream. For more information about limits, see Amazon Kinesis Data Firehose Limits. Each PutRecordBatch request supports up to 500 records. Each record in the request can be as large as 1,000 KB (before 64-bit encoding), up to a limit of 4 MB for the entire request. These limits cannot be changed. You must specify the name of the delivery stream and the data record when using PutRecord. The data record consists of a data blob that can be up to 1,000 KB in size, and any kind of data. For example, it could be a segment from a log file, geographic location data, website clickstream data, and so on. Kinesis Data Firehose buffers records before delivering them to the destination. To disambiguate the data blobs at the destination, a common solution is to use delimiters in the data, such as a newline (\n) or some other character unique within the data. This allows the consumer application to parse individual data items when reading the data from the destination. The PutRecordBatch response includes a count of failed records, FailedPutCount, and an array of responses, RequestResponses. Each entry in the RequestResponses array provides additional information about the processed record. It directly correlates with a record in the request array using the same ordering, from the top to the bottom. The response array always includes the same number of records as the request array. RequestResponses includes both successfully and unsuccessfully processed records. Kinesis Data Firehose tries to process all records in each PutRecordBatch request. A single record failure does not stop the processing of subsequent records. A successfully processed record includes a RecordId value, which is unique for the record. An unsuccessfully processed record includes ErrorCode and ErrorMessage values. ErrorCode reflects the type of error, and is one of the following values: ServiceUnavailable or InternalFailure. ErrorMessage provides more detailed information about the error. If there is an internal server error or a timeout, the write might have completed or it might have failed. If FailedPutCount is greater than 0, retry the request, resending only those records that might have failed processing. This minimizes the possible duplicate records and also reduces the total bytes sent (and corresponding charges). We recommend that you handle any duplicates at the destination. If PutRecordBatch throws ServiceUnavailableException, back off and retry. If the exception persists, it is possible that the throughput limits have been exceeded for the delivery stream. Data records sent to Kinesis Data Firehose are stored for 24 hours from the time they are added to a delivery stream as it attempts to send the records to the destination. If the destination is unreachable for more than 24 hours, the data is no longer available.
   */
  putRecordBatch(callback?: (err: AWSError, data: Firehose.Types.PutRecordBatchOutput) => void): Request<Firehose.Types.PutRecordBatchOutput, AWSError>;
  /**
   * Adds or updates tags for the specified delivery stream. A tag is a key-value pair (the value is optional) that you can define and assign to AWS resources. If you specify a tag that already exists, the tag value is replaced with the value that you specify in the request. Tags are metadata. For example, you can add friendly names and descriptions or other types of information that can help you distinguish the delivery stream. For more information about tags, see Using Cost Allocation Tags in the AWS Billing and Cost Management User Guide.   Each delivery stream can have up to 50 tags.   This operation has a limit of five transactions per second per account. 
   */
  tagDeliveryStream(params: Firehose.Types.TagDeliveryStreamInput, callback?: (err: AWSError, data: Firehose.Types.TagDeliveryStreamOutput) => void): Request<Firehose.Types.TagDeliveryStreamOutput, AWSError>;
  /**
   * Adds or updates tags for the specified delivery stream. A tag is a key-value pair (the value is optional) that you can define and assign to AWS resources. If you specify a tag that already exists, the tag value is replaced with the value that you specify in the request. Tags are metadata. For example, you can add friendly names and descriptions or other types of information that can help you distinguish the delivery stream. For more information about tags, see Using Cost Allocation Tags in the AWS Billing and Cost Management User Guide.   Each delivery stream can have up to 50 tags.   This operation has a limit of five transactions per second per account. 
   */
  tagDeliveryStream(callback?: (err: AWSError, data: Firehose.Types.TagDeliveryStreamOutput) => void): Request<Firehose.Types.TagDeliveryStreamOutput, AWSError>;
  /**
   * Removes tags from the specified delivery stream. Removed tags are deleted, and you can't recover them after this operation successfully completes. If you specify a tag that doesn't exist, the operation ignores it. This operation has a limit of five transactions per second per account. 
   */
  untagDeliveryStream(params: Firehose.Types.UntagDeliveryStreamInput, callback?: (err: AWSError, data: Firehose.Types.UntagDeliveryStreamOutput) => void): Request<Firehose.Types.UntagDeliveryStreamOutput, AWSError>;
  /**
   * Removes tags from the specified delivery stream. Removed tags are deleted, and you can't recover them after this operation successfully completes. If you specify a tag that doesn't exist, the operation ignores it. This operation has a limit of five transactions per second per account. 
   */
  untagDeliveryStream(callback?: (err: AWSError, data: Firehose.Types.UntagDeliveryStreamOutput) => void): Request<Firehose.Types.UntagDeliveryStreamOutput, AWSError>;
  /**
   * Updates the specified destination of the specified delivery stream. Use this operation to change the destination type (for example, to replace the Amazon S3 destination with Amazon Redshift) or change the parameters associated with a destination (for example, to change the bucket name of the Amazon S3 destination). The update might not occur immediately. The target delivery stream remains active while the configurations are updated, so data writes to the delivery stream can continue during this process. The updated configurations are usually effective within a few minutes. Switching between Amazon ES and other services is not supported. For an Amazon ES destination, you can only update to another Amazon ES destination. If the destination type is the same, Kinesis Data Firehose merges the configuration parameters specified with the destination configuration that already exists on the delivery stream. If any of the parameters are not specified in the call, the existing values are retained. For example, in the Amazon S3 destination, if EncryptionConfiguration is not specified, then the existing EncryptionConfiguration is maintained on the destination. If the destination type is not the same, for example, changing the destination from Amazon S3 to Amazon Redshift, Kinesis Data Firehose does not merge any parameters. In this case, all parameters must be specified. Kinesis Data Firehose uses CurrentDeliveryStreamVersionId to avoid race conditions and conflicting merges. This is a required field, and the service updates the configuration only if the existing configuration has a version ID that matches. After the update is applied successfully, the version ID is updated, and can be retrieved using DescribeDeliveryStream. Use the new version ID to set CurrentDeliveryStreamVersionId in the next call.
   */
  updateDestination(params: Firehose.Types.UpdateDestinationInput, callback?: (err: AWSError, data: Firehose.Types.UpdateDestinationOutput) => void): Request<Firehose.Types.UpdateDestinationOutput, AWSError>;
  /**
   * Updates the specified destination of the specified delivery stream. Use this operation to change the destination type (for example, to replace the Amazon S3 destination with Amazon Redshift) or change the parameters associated with a destination (for example, to change the bucket name of the Amazon S3 destination). The update might not occur immediately. The target delivery stream remains active while the configurations are updated, so data writes to the delivery stream can continue during this process. The updated configurations are usually effective within a few minutes. Switching between Amazon ES and other services is not supported. For an Amazon ES destination, you can only update to another Amazon ES destination. If the destination type is the same, Kinesis Data Firehose merges the configuration parameters specified with the destination configuration that already exists on the delivery stream. If any of the parameters are not specified in the call, the existing values are retained. For example, in the Amazon S3 destination, if EncryptionConfiguration is not specified, then the existing EncryptionConfiguration is maintained on the destination. If the destination type is not the same, for example, changing the destination from Amazon S3 to Amazon Redshift, Kinesis Data Firehose does not merge any parameters. In this case, all parameters must be specified. Kinesis Data Firehose uses CurrentDeliveryStreamVersionId to avoid race conditions and conflicting merges. This is a required field, and the service updates the configuration only if the existing configuration has a version ID that matches. After the update is applied successfully, the version ID is updated, and can be retrieved using DescribeDeliveryStream. Use the new version ID to set CurrentDeliveryStreamVersionId in the next call.
   */
  updateDestination(callback?: (err: AWSError, data: Firehose.Types.UpdateDestinationOutput) => void): Request<Firehose.Types.UpdateDestinationOutput, AWSError>;
}
declare namespace Firehose {
  export type AWSKMSKeyARN = string;
  export type BlockSizeBytes = number;
  export type BooleanObject = boolean;
  export type BucketARN = string;
  export interface BufferingHints {
    /**
     * Buffer incoming data to the specified size, in MBs, before delivering it to the destination. The default value is 5. We recommend setting this parameter to a value greater than the amount of data you typically ingest into the delivery stream in 10 seconds. For example, if you typically ingest data at 1 MB/sec, the value should be 10 MB or higher.
     */
    SizeInMBs?: SizeInMBs;
    /**
     * Buffer incoming data for the specified period of time, in seconds, before delivering it to the destination. The default value is 300.
     */
    IntervalInSeconds?: IntervalInSeconds;
  }
  export interface CloudWatchLoggingOptions {
    /**
     * Enables or disables CloudWatch logging.
     */
    Enabled?: BooleanObject;
    /**
     * The CloudWatch group name for logging. This value is required if CloudWatch logging is enabled.
     */
    LogGroupName?: LogGroupName;
    /**
     * The CloudWatch log stream name for logging. This value is required if CloudWatch logging is enabled.
     */
    LogStreamName?: LogStreamName;
  }
  export type ClusterJDBCURL = string;
  export type ColumnToJsonKeyMappings = {[key: string]: NonEmptyString};
  export type CompressionFormat = "UNCOMPRESSED"|"GZIP"|"ZIP"|"Snappy"|string;
  export interface CopyCommand {
    /**
     * The name of the target table. The table must already exist in the database.
     */
    DataTableName: DataTableName;
    /**
     * A comma-separated list of column names.
     */
    DataTableColumns?: DataTableColumns;
    /**
     * Optional parameters to use with the Amazon Redshift COPY command. For more information, see the "Optional Parameters" section of Amazon Redshift COPY command. Some possible examples that would apply to Kinesis Data Firehose are as follows:  delimiter '\t' lzop; - fields are delimited with "\t" (TAB character) and compressed using lzop.  delimiter '|' - fields are delimited with "|" (this is the default delimiter).  delimiter '|' escape - the delimiter should be escaped.  fixedwidth 'venueid:3,venuename:25,venuecity:12,venuestate:2,venueseats:6' - fields are fixed width in the source, with each width specified after every column in the table.  JSON 's3://mybucket/jsonpaths.txt' - data is in JSON format, and the path specified is the format of the data. For more examples, see Amazon Redshift COPY command examples.
     */
    CopyOptions?: CopyOptions;
  }
  export type CopyOptions = string;
  export interface CreateDeliveryStreamInput {
    /**
     * The name of the delivery stream. This name must be unique per AWS account in the same AWS Region. If the delivery streams are in different accounts or different Regions, you can have multiple delivery streams with the same name.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * The delivery stream type. This parameter can be one of the following values:    DirectPut: Provider applications access the delivery stream directly.    KinesisStreamAsSource: The delivery stream uses a Kinesis data stream as a source.  
     */
    DeliveryStreamType?: DeliveryStreamType;
    /**
     * When a Kinesis data stream is used as the source for the delivery stream, a KinesisStreamSourceConfiguration containing the Kinesis data stream Amazon Resource Name (ARN) and the role ARN for the source stream.
     */
    KinesisStreamSourceConfiguration?: KinesisStreamSourceConfiguration;
    /**
     * [Deprecated] The destination in Amazon S3. You can specify only one destination.
     */
    S3DestinationConfiguration?: S3DestinationConfiguration;
    /**
     * The destination in Amazon S3. You can specify only one destination.
     */
    ExtendedS3DestinationConfiguration?: ExtendedS3DestinationConfiguration;
    /**
     * The destination in Amazon Redshift. You can specify only one destination.
     */
    RedshiftDestinationConfiguration?: RedshiftDestinationConfiguration;
    /**
     * The destination in Amazon ES. You can specify only one destination.
     */
    ElasticsearchDestinationConfiguration?: ElasticsearchDestinationConfiguration;
    /**
     * The destination in Splunk. You can specify only one destination.
     */
    SplunkDestinationConfiguration?: SplunkDestinationConfiguration;
  }
  export interface CreateDeliveryStreamOutput {
    /**
     * The ARN of the delivery stream.
     */
    DeliveryStreamARN?: DeliveryStreamARN;
  }
  export type Data = Buffer|Uint8Array|Blob|string;
  export interface DataFormatConversionConfiguration {
    /**
     * Specifies the AWS Glue Data Catalog table that contains the column information.
     */
    SchemaConfiguration?: SchemaConfiguration;
    /**
     * Specifies the deserializer that you want Kinesis Data Firehose to use to convert the format of your data from JSON.
     */
    InputFormatConfiguration?: InputFormatConfiguration;
    /**
     * Specifies the serializer that you want Kinesis Data Firehose to use to convert the format of your data to the Parquet or ORC format.
     */
    OutputFormatConfiguration?: OutputFormatConfiguration;
    /**
     * Defaults to true. Set it to false if you want to disable format conversion while preserving the configuration details.
     */
    Enabled?: BooleanObject;
  }
  export type DataTableColumns = string;
  export type DataTableName = string;
  export interface DeleteDeliveryStreamInput {
    /**
     * The name of the delivery stream.
     */
    DeliveryStreamName: DeliveryStreamName;
  }
  export interface DeleteDeliveryStreamOutput {
  }
  export type DeliveryStartTimestamp = Date;
  export type DeliveryStreamARN = string;
  export interface DeliveryStreamDescription {
    /**
     * The name of the delivery stream.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * The Amazon Resource Name (ARN) of the delivery stream. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    DeliveryStreamARN: DeliveryStreamARN;
    /**
     * The status of the delivery stream.
     */
    DeliveryStreamStatus: DeliveryStreamStatus;
    /**
     * The delivery stream type. This can be one of the following values:    DirectPut: Provider applications access the delivery stream directly.    KinesisStreamAsSource: The delivery stream uses a Kinesis data stream as a source.  
     */
    DeliveryStreamType: DeliveryStreamType;
    /**
     * Each time the destination is updated for a delivery stream, the version ID is changed, and the current version ID is required when updating the destination. This is so that the service knows it is applying the changes to the correct version of the delivery stream.
     */
    VersionId: DeliveryStreamVersionId;
    /**
     * The date and time that the delivery stream was created.
     */
    CreateTimestamp?: Timestamp;
    /**
     * The date and time that the delivery stream was last updated.
     */
    LastUpdateTimestamp?: Timestamp;
    /**
     * If the DeliveryStreamType parameter is KinesisStreamAsSource, a SourceDescription object describing the source Kinesis data stream.
     */
    Source?: SourceDescription;
    /**
     * The destinations.
     */
    Destinations: DestinationDescriptionList;
    /**
     * Indicates whether there are more destinations available to list.
     */
    HasMoreDestinations: BooleanObject;
  }
  export type DeliveryStreamName = string;
  export type DeliveryStreamNameList = DeliveryStreamName[];
  export type DeliveryStreamStatus = "CREATING"|"DELETING"|"ACTIVE"|string;
  export type DeliveryStreamType = "DirectPut"|"KinesisStreamAsSource"|string;
  export type DeliveryStreamVersionId = string;
  export interface DescribeDeliveryStreamInput {
    /**
     * The name of the delivery stream.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * The limit on the number of destinations to return. You can have one destination per delivery stream.
     */
    Limit?: DescribeDeliveryStreamInputLimit;
    /**
     * The ID of the destination to start returning the destination information. Kinesis Data Firehose supports one destination per delivery stream.
     */
    ExclusiveStartDestinationId?: DestinationId;
  }
  export type DescribeDeliveryStreamInputLimit = number;
  export interface DescribeDeliveryStreamOutput {
    /**
     * Information about the delivery stream.
     */
    DeliveryStreamDescription: DeliveryStreamDescription;
  }
  export interface Deserializer {
    /**
     * The OpenX SerDe. Used by Kinesis Data Firehose for deserializing data, which means converting it from the JSON format in preparation for serializing it to the Parquet or ORC format. This is one of two deserializers you can choose, depending on which one offers the functionality you need. The other option is the native Hive / HCatalog JsonSerDe.
     */
    OpenXJsonSerDe?: OpenXJsonSerDe;
    /**
     * The native Hive / HCatalog JsonSerDe. Used by Kinesis Data Firehose for deserializing data, which means converting it from the JSON format in preparation for serializing it to the Parquet or ORC format. This is one of two deserializers you can choose, depending on which one offers the functionality you need. The other option is the OpenX SerDe.
     */
    HiveJsonSerDe?: HiveJsonSerDe;
  }
  export interface DestinationDescription {
    /**
     * The ID of the destination.
     */
    DestinationId: DestinationId;
    /**
     * [Deprecated] The destination in Amazon S3.
     */
    S3DestinationDescription?: S3DestinationDescription;
    /**
     * The destination in Amazon S3.
     */
    ExtendedS3DestinationDescription?: ExtendedS3DestinationDescription;
    /**
     * The destination in Amazon Redshift.
     */
    RedshiftDestinationDescription?: RedshiftDestinationDescription;
    /**
     * The destination in Amazon ES.
     */
    ElasticsearchDestinationDescription?: ElasticsearchDestinationDescription;
    /**
     * The destination in Splunk.
     */
    SplunkDestinationDescription?: SplunkDestinationDescription;
  }
  export type DestinationDescriptionList = DestinationDescription[];
  export type DestinationId = string;
  export interface ElasticsearchBufferingHints {
    /**
     * Buffer incoming data for the specified period of time, in seconds, before delivering it to the destination. The default value is 300 (5 minutes).
     */
    IntervalInSeconds?: ElasticsearchBufferingIntervalInSeconds;
    /**
     * Buffer incoming data to the specified size, in MBs, before delivering it to the destination. The default value is 5. We recommend setting this parameter to a value greater than the amount of data you typically ingest into the delivery stream in 10 seconds. For example, if you typically ingest data at 1 MB/sec, the value should be 10 MB or higher.
     */
    SizeInMBs?: ElasticsearchBufferingSizeInMBs;
  }
  export type ElasticsearchBufferingIntervalInSeconds = number;
  export type ElasticsearchBufferingSizeInMBs = number;
  export interface ElasticsearchDestinationConfiguration {
    /**
     * The Amazon Resource Name (ARN) of the IAM role to be assumed by Kinesis Data Firehose for calling the Amazon ES Configuration API and for indexing documents. For more information, see Grant Kinesis Data Firehose Access to an Amazon S3 Destination and Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN: RoleARN;
    /**
     * The ARN of the Amazon ES domain. The IAM role must have permissions for DescribeElasticsearchDomain, DescribeElasticsearchDomains, and DescribeElasticsearchDomainConfig after assuming the role specified in RoleARN. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    DomainARN: ElasticsearchDomainARN;
    /**
     * The Elasticsearch index name.
     */
    IndexName: ElasticsearchIndexName;
    /**
     * The Elasticsearch type name. For Elasticsearch 6.x, there can be only one type per index. If you try to specify a new type for an existing index that already has another type, Kinesis Data Firehose returns an error during run time.
     */
    TypeName: ElasticsearchTypeName;
    /**
     * The Elasticsearch index rotation period. Index rotation appends a time stamp to the IndexName to facilitate the expiration of old data. For more information, see Index Rotation for the Amazon ES Destination. The default value is OneDay.
     */
    IndexRotationPeriod?: ElasticsearchIndexRotationPeriod;
    /**
     * The buffering options. If no value is specified, the default values for ElasticsearchBufferingHints are used.
     */
    BufferingHints?: ElasticsearchBufferingHints;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver documents to Amazon ES. The default value is 300 (5 minutes).
     */
    RetryOptions?: ElasticsearchRetryOptions;
    /**
     * Defines how documents should be delivered to Amazon S3. When it is set to FailedDocumentsOnly, Kinesis Data Firehose writes any documents that could not be indexed to the configured Amazon S3 destination, with elasticsearch-failed/ appended to the key prefix. When set to AllDocuments, Kinesis Data Firehose delivers all incoming records to Amazon S3, and also writes failed documents with elasticsearch-failed/ appended to the prefix. For more information, see Amazon S3 Backup for the Amazon ES Destination. Default value is FailedDocumentsOnly.
     */
    S3BackupMode?: ElasticsearchS3BackupMode;
    /**
     * The configuration for the backup Amazon S3 location.
     */
    S3Configuration: S3DestinationConfiguration;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface ElasticsearchDestinationDescription {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN?: RoleARN;
    /**
     * The ARN of the Amazon ES domain. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    DomainARN?: ElasticsearchDomainARN;
    /**
     * The Elasticsearch index name.
     */
    IndexName?: ElasticsearchIndexName;
    /**
     * The Elasticsearch type name.
     */
    TypeName?: ElasticsearchTypeName;
    /**
     * The Elasticsearch index rotation period
     */
    IndexRotationPeriod?: ElasticsearchIndexRotationPeriod;
    /**
     * The buffering options.
     */
    BufferingHints?: ElasticsearchBufferingHints;
    /**
     * The Amazon ES retry options.
     */
    RetryOptions?: ElasticsearchRetryOptions;
    /**
     * The Amazon S3 backup mode.
     */
    S3BackupMode?: ElasticsearchS3BackupMode;
    /**
     * The Amazon S3 destination.
     */
    S3DestinationDescription?: S3DestinationDescription;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon CloudWatch logging options.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface ElasticsearchDestinationUpdate {
    /**
     * The Amazon Resource Name (ARN) of the IAM role to be assumed by Kinesis Data Firehose for calling the Amazon ES Configuration API and for indexing documents. For more information, see Grant Kinesis Data Firehose Access to an Amazon S3 Destination and Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN?: RoleARN;
    /**
     * The ARN of the Amazon ES domain. The IAM role must have permissions for DescribeElasticsearchDomain, DescribeElasticsearchDomains, and DescribeElasticsearchDomainConfig after assuming the IAM role specified in RoleARN. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    DomainARN?: ElasticsearchDomainARN;
    /**
     * The Elasticsearch index name.
     */
    IndexName?: ElasticsearchIndexName;
    /**
     * The Elasticsearch type name. For Elasticsearch 6.x, there can be only one type per index. If you try to specify a new type for an existing index that already has another type, Kinesis Data Firehose returns an error during runtime.
     */
    TypeName?: ElasticsearchTypeName;
    /**
     * The Elasticsearch index rotation period. Index rotation appends a time stamp to IndexName to facilitate the expiration of old data. For more information, see Index Rotation for the Amazon ES Destination. Default value is OneDay.
     */
    IndexRotationPeriod?: ElasticsearchIndexRotationPeriod;
    /**
     * The buffering options. If no value is specified, ElasticsearchBufferingHints object default values are used. 
     */
    BufferingHints?: ElasticsearchBufferingHints;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver documents to Amazon ES. The default value is 300 (5 minutes).
     */
    RetryOptions?: ElasticsearchRetryOptions;
    /**
     * The Amazon S3 destination.
     */
    S3Update?: S3DestinationUpdate;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export type ElasticsearchDomainARN = string;
  export type ElasticsearchIndexName = string;
  export type ElasticsearchIndexRotationPeriod = "NoRotation"|"OneHour"|"OneDay"|"OneWeek"|"OneMonth"|string;
  export type ElasticsearchRetryDurationInSeconds = number;
  export interface ElasticsearchRetryOptions {
    /**
     * After an initial failure to deliver to Amazon ES, the total amount of time during which Kinesis Data Firehose retries delivery (including the first attempt). After this time has elapsed, the failed documents are written to Amazon S3. Default value is 300 seconds (5 minutes). A value of 0 (zero) results in no retries.
     */
    DurationInSeconds?: ElasticsearchRetryDurationInSeconds;
  }
  export type ElasticsearchS3BackupMode = "FailedDocumentsOnly"|"AllDocuments"|string;
  export type ElasticsearchTypeName = string;
  export interface EncryptionConfiguration {
    /**
     * Specifically override existing encryption information to ensure that no encryption is used.
     */
    NoEncryptionConfig?: NoEncryptionConfig;
    /**
     * The encryption key.
     */
    KMSEncryptionConfig?: KMSEncryptionConfig;
  }
  export type ErrorCode = string;
  export type ErrorMessage = string;
  export interface ExtendedS3DestinationConfiguration {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN: RoleARN;
    /**
     * The ARN of the S3 bucket. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    BucketARN: BucketARN;
    /**
     * The "YYYY/MM/DD/HH" time format prefix is automatically used for delivered Amazon S3 files. You can specify an extra prefix to be added in front of the time format prefix. If the prefix ends with a slash, it appears as a folder in the S3 bucket. For more information, see Amazon S3 Object Name Format in the Amazon Kinesis Data Firehose Developer Guide.
     */
    Prefix?: Prefix;
    /**
     * The buffering option.
     */
    BufferingHints?: BufferingHints;
    /**
     * The compression format. If no value is specified, the default is UNCOMPRESSED.
     */
    CompressionFormat?: CompressionFormat;
    /**
     * The encryption configuration. If no value is specified, the default is no encryption.
     */
    EncryptionConfiguration?: EncryptionConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon S3 backup mode.
     */
    S3BackupMode?: S3BackupMode;
    /**
     * The configuration for backup in Amazon S3.
     */
    S3BackupConfiguration?: S3DestinationConfiguration;
    /**
     * The serializer, deserializer, and schema for converting data from the JSON format to the Parquet or ORC format before writing it to Amazon S3.
     */
    DataFormatConversionConfiguration?: DataFormatConversionConfiguration;
  }
  export interface ExtendedS3DestinationDescription {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN: RoleARN;
    /**
     * The ARN of the S3 bucket. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    BucketARN: BucketARN;
    /**
     * The "YYYY/MM/DD/HH" time format prefix is automatically used for delivered Amazon S3 files. You can specify an extra prefix to be added in front of the time format prefix. If the prefix ends with a slash, it appears as a folder in the S3 bucket. For more information, see Amazon S3 Object Name Format in the Amazon Kinesis Data Firehose Developer Guide.
     */
    Prefix?: Prefix;
    /**
     * The buffering option.
     */
    BufferingHints: BufferingHints;
    /**
     * The compression format. If no value is specified, the default is UNCOMPRESSED.
     */
    CompressionFormat: CompressionFormat;
    /**
     * The encryption configuration. If no value is specified, the default is no encryption.
     */
    EncryptionConfiguration: EncryptionConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon S3 backup mode.
     */
    S3BackupMode?: S3BackupMode;
    /**
     * The configuration for backup in Amazon S3.
     */
    S3BackupDescription?: S3DestinationDescription;
    /**
     * The serializer, deserializer, and schema for converting data from the JSON format to the Parquet or ORC format before writing it to Amazon S3.
     */
    DataFormatConversionConfiguration?: DataFormatConversionConfiguration;
  }
  export interface ExtendedS3DestinationUpdate {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN?: RoleARN;
    /**
     * The ARN of the S3 bucket. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    BucketARN?: BucketARN;
    /**
     * The "YYYY/MM/DD/HH" time format prefix is automatically used for delivered Amazon S3 files. You can specify an extra prefix to be added in front of the time format prefix. If the prefix ends with a slash, it appears as a folder in the S3 bucket. For more information, see Amazon S3 Object Name Format in the Amazon Kinesis Data Firehose Developer Guide.
     */
    Prefix?: Prefix;
    /**
     * The buffering option.
     */
    BufferingHints?: BufferingHints;
    /**
     * The compression format. If no value is specified, the default is UNCOMPRESSED. 
     */
    CompressionFormat?: CompressionFormat;
    /**
     * The encryption configuration. If no value is specified, the default is no encryption.
     */
    EncryptionConfiguration?: EncryptionConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * Enables or disables Amazon S3 backup mode.
     */
    S3BackupMode?: S3BackupMode;
    /**
     * The Amazon S3 destination for backup.
     */
    S3BackupUpdate?: S3DestinationUpdate;
    /**
     * The serializer, deserializer, and schema for converting data from the JSON format to the Parquet or ORC format before writing it to Amazon S3.
     */
    DataFormatConversionConfiguration?: DataFormatConversionConfiguration;
  }
  export type HECAcknowledgmentTimeoutInSeconds = number;
  export type HECEndpoint = string;
  export type HECEndpointType = "Raw"|"Event"|string;
  export type HECToken = string;
  export interface HiveJsonSerDe {
    /**
     * Indicates how you want Kinesis Data Firehose to parse the date and time stamps that may be present in your input data JSON. To specify these format strings, follow the pattern syntax of JodaTime's DateTimeFormat format strings. For more information, see Class DateTimeFormat. You can also use the special value millis to parse time stamps in epoch milliseconds. If you don't specify a format, Kinesis Data Firehose uses java.sql.Timestamp::valueOf by default.
     */
    TimestampFormats?: ListOfNonEmptyStrings;
  }
  export interface InputFormatConfiguration {
    /**
     * Specifies which deserializer to use. You can choose either the Apache Hive JSON SerDe or the OpenX JSON SerDe. If both are non-null, the server rejects the request.
     */
    Deserializer?: Deserializer;
  }
  export type IntervalInSeconds = number;
  export interface KMSEncryptionConfig {
    /**
     * The Amazon Resource Name (ARN) of the encryption key. Must belong to the same AWS Region as the destination Amazon S3 bucket. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    AWSKMSKeyARN: AWSKMSKeyARN;
  }
  export type KinesisStreamARN = string;
  export interface KinesisStreamSourceConfiguration {
    /**
     * The ARN of the source Kinesis data stream. For more information, see Amazon Kinesis Data Streams ARN Format.
     */
    KinesisStreamARN: KinesisStreamARN;
    /**
     * The ARN of the role that provides access to the source Kinesis data stream. For more information, see AWS Identity and Access Management (IAM) ARN Format.
     */
    RoleARN: RoleARN;
  }
  export interface KinesisStreamSourceDescription {
    /**
     * The Amazon Resource Name (ARN) of the source Kinesis data stream. For more information, see Amazon Kinesis Data Streams ARN Format.
     */
    KinesisStreamARN?: KinesisStreamARN;
    /**
     * The ARN of the role used by the source Kinesis data stream. For more information, see AWS Identity and Access Management (IAM) ARN Format.
     */
    RoleARN?: RoleARN;
    /**
     * Kinesis Data Firehose starts retrieving records from the Kinesis data stream starting with this time stamp.
     */
    DeliveryStartTimestamp?: DeliveryStartTimestamp;
  }
  export interface ListDeliveryStreamsInput {
    /**
     * The maximum number of delivery streams to list. The default value is 10.
     */
    Limit?: ListDeliveryStreamsInputLimit;
    /**
     * The delivery stream type. This can be one of the following values:    DirectPut: Provider applications access the delivery stream directly.    KinesisStreamAsSource: The delivery stream uses a Kinesis data stream as a source.   This parameter is optional. If this parameter is omitted, delivery streams of all types are returned.
     */
    DeliveryStreamType?: DeliveryStreamType;
    /**
     * The name of the delivery stream to start the list with.
     */
    ExclusiveStartDeliveryStreamName?: DeliveryStreamName;
  }
  export type ListDeliveryStreamsInputLimit = number;
  export interface ListDeliveryStreamsOutput {
    /**
     * The names of the delivery streams.
     */
    DeliveryStreamNames: DeliveryStreamNameList;
    /**
     * Indicates whether there are more delivery streams available to list.
     */
    HasMoreDeliveryStreams: BooleanObject;
  }
  export type ListOfNonEmptyStrings = NonEmptyString[];
  export type ListOfNonEmptyStringsWithoutWhitespace = NonEmptyStringWithoutWhitespace[];
  export interface ListTagsForDeliveryStreamInput {
    /**
     * The name of the delivery stream whose tags you want to list.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * The key to use as the starting point for the list of tags. If you set this parameter, ListTagsForDeliveryStream gets all tags that occur after ExclusiveStartTagKey.
     */
    ExclusiveStartTagKey?: TagKey;
    /**
     * The number of tags to return. If this number is less than the total number of tags associated with the delivery stream, HasMoreTags is set to true in the response. To list additional tags, set ExclusiveStartTagKey to the last key in the response. 
     */
    Limit?: ListTagsForDeliveryStreamInputLimit;
  }
  export type ListTagsForDeliveryStreamInputLimit = number;
  export interface ListTagsForDeliveryStreamOutput {
    /**
     * A list of tags associated with DeliveryStreamName, starting with the first tag after ExclusiveStartTagKey and up to the specified Limit.
     */
    Tags: ListTagsForDeliveryStreamOutputTagList;
    /**
     * If this is true in the response, more tags are available. To list the remaining tags, set ExclusiveStartTagKey to the key of the last tag returned and call ListTagsForDeliveryStream again.
     */
    HasMoreTags: BooleanObject;
  }
  export type ListTagsForDeliveryStreamOutputTagList = Tag[];
  export type LogGroupName = string;
  export type LogStreamName = string;
  export type NoEncryptionConfig = "NoEncryption"|string;
  export type NonEmptyString = string;
  export type NonEmptyStringWithoutWhitespace = string;
  export type NonNegativeIntegerObject = number;
  export interface OpenXJsonSerDe {
    /**
     * When set to true, specifies that the names of the keys include dots and that you want Kinesis Data Firehose to replace them with underscores. This is useful because Apache Hive does not allow dots in column names. For example, if the JSON contains a key whose name is "a.b", you can define the column name to be "a_b" when using this option. The default is false.
     */
    ConvertDotsInJsonKeysToUnderscores?: BooleanObject;
    /**
     * When set to true, which is the default, Kinesis Data Firehose converts JSON keys to lowercase before deserializing them.
     */
    CaseInsensitive?: BooleanObject;
    /**
     * Maps column names to JSON keys that aren't identical to the column names. This is useful when the JSON contains keys that are Hive keywords. For example, timestamp is a Hive keyword. If you have a JSON key named timestamp, set this parameter to {"ts": "timestamp"} to map this key to a column named ts.
     */
    ColumnToJsonKeyMappings?: ColumnToJsonKeyMappings;
  }
  export type OrcCompression = "NONE"|"ZLIB"|"SNAPPY"|string;
  export type OrcFormatVersion = "V0_11"|"V0_12"|string;
  export type OrcRowIndexStride = number;
  export interface OrcSerDe {
    /**
     * The number of bytes in each stripe. The default is 64 MiB and the minimum is 8 MiB.
     */
    StripeSizeBytes?: OrcStripeSizeBytes;
    /**
     * The Hadoop Distributed File System (HDFS) block size. This is useful if you intend to copy the data from Amazon S3 to HDFS before querying. The default is 256 MiB and the minimum is 64 MiB. Kinesis Data Firehose uses this value for padding calculations.
     */
    BlockSizeBytes?: BlockSizeBytes;
    /**
     * The number of rows between index entries. The default is 10,000 and the minimum is 1,000.
     */
    RowIndexStride?: OrcRowIndexStride;
    /**
     * Set this to true to indicate that you want stripes to be padded to the HDFS block boundaries. This is useful if you intend to copy the data from Amazon S3 to HDFS before querying. The default is false.
     */
    EnablePadding?: BooleanObject;
    /**
     * A number between 0 and 1 that defines the tolerance for block padding as a decimal fraction of stripe size. The default value is 0.05, which means 5 percent of stripe size. For the default values of 64 MiB ORC stripes and 256 MiB HDFS blocks, the default block padding tolerance of 5 percent reserves a maximum of 3.2 MiB for padding within the 256 MiB block. In such a case, if the available size within the block is more than 3.2 MiB, a new, smaller stripe is inserted to fit within that space. This ensures that no stripe crosses block boundaries and causes remote reads within a node-local task. Kinesis Data Firehose ignores this parameter when OrcSerDe$EnablePadding is false.
     */
    PaddingTolerance?: Proportion;
    /**
     * The compression code to use over data blocks. The default is SNAPPY.
     */
    Compression?: OrcCompression;
    /**
     * The column names for which you want Kinesis Data Firehose to create bloom filters. The default is null.
     */
    BloomFilterColumns?: ListOfNonEmptyStringsWithoutWhitespace;
    /**
     * The Bloom filter false positive probability (FPP). The lower the FPP, the bigger the Bloom filter. The default value is 0.05, the minimum is 0, and the maximum is 1.
     */
    BloomFilterFalsePositiveProbability?: Proportion;
    /**
     * Represents the fraction of the total number of non-null rows. To turn off dictionary encoding, set this fraction to a number that is less than the number of distinct keys in a dictionary. To always use dictionary encoding, set this threshold to 1.
     */
    DictionaryKeyThreshold?: Proportion;
    /**
     * The version of the file to write. The possible values are V0_11 and V0_12. The default is V0_12.
     */
    FormatVersion?: OrcFormatVersion;
  }
  export type OrcStripeSizeBytes = number;
  export interface OutputFormatConfiguration {
    /**
     * Specifies which serializer to use. You can choose either the ORC SerDe or the Parquet SerDe. If both are non-null, the server rejects the request.
     */
    Serializer?: Serializer;
  }
  export type ParquetCompression = "UNCOMPRESSED"|"GZIP"|"SNAPPY"|string;
  export type ParquetPageSizeBytes = number;
  export interface ParquetSerDe {
    /**
     * The Hadoop Distributed File System (HDFS) block size. This is useful if you intend to copy the data from Amazon S3 to HDFS before querying. The default is 256 MiB and the minimum is 64 MiB. Kinesis Data Firehose uses this value for padding calculations.
     */
    BlockSizeBytes?: BlockSizeBytes;
    /**
     * The Parquet page size. Column chunks are divided into pages. A page is conceptually an indivisible unit (in terms of compression and encoding). The minimum value is 64 KiB and the default is 1 MiB.
     */
    PageSizeBytes?: ParquetPageSizeBytes;
    /**
     * The compression code to use over data blocks. The possible values are UNCOMPRESSED, SNAPPY, and GZIP, with the default being SNAPPY. Use SNAPPY for higher decompression speed. Use GZIP if the compression ration is more important than speed.
     */
    Compression?: ParquetCompression;
    /**
     * Indicates whether to enable dictionary compression.
     */
    EnableDictionaryCompression?: BooleanObject;
    /**
     * The maximum amount of padding to apply. This is useful if you intend to copy the data from Amazon S3 to HDFS before querying. The default is 0.
     */
    MaxPaddingBytes?: NonNegativeIntegerObject;
    /**
     * Indicates the version of row format to output. The possible values are V1 and V2. The default is V1.
     */
    WriterVersion?: ParquetWriterVersion;
  }
  export type ParquetWriterVersion = "V1"|"V2"|string;
  export type Password = string;
  export type Prefix = string;
  export interface ProcessingConfiguration {
    /**
     * Enables or disables data processing.
     */
    Enabled?: BooleanObject;
    /**
     * The data processors.
     */
    Processors?: ProcessorList;
  }
  export interface Processor {
    /**
     * The type of processor.
     */
    Type: ProcessorType;
    /**
     * The processor parameters.
     */
    Parameters?: ProcessorParameterList;
  }
  export type ProcessorList = Processor[];
  export interface ProcessorParameter {
    /**
     * The name of the parameter.
     */
    ParameterName: ProcessorParameterName;
    /**
     * The parameter value.
     */
    ParameterValue: ProcessorParameterValue;
  }
  export type ProcessorParameterList = ProcessorParameter[];
  export type ProcessorParameterName = "LambdaArn"|"NumberOfRetries"|"RoleArn"|"BufferSizeInMBs"|"BufferIntervalInSeconds"|string;
  export type ProcessorParameterValue = string;
  export type ProcessorType = "Lambda"|string;
  export type Proportion = number;
  export interface PutRecordBatchInput {
    /**
     * The name of the delivery stream.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * One or more records.
     */
    Records: PutRecordBatchRequestEntryList;
  }
  export interface PutRecordBatchOutput {
    /**
     * The number of records that might have failed processing.
     */
    FailedPutCount: NonNegativeIntegerObject;
    /**
     * The results array. For each record, the index of the response element is the same as the index used in the request array.
     */
    RequestResponses: PutRecordBatchResponseEntryList;
  }
  export type PutRecordBatchRequestEntryList = Record[];
  export interface PutRecordBatchResponseEntry {
    /**
     * The ID of the record.
     */
    RecordId?: PutResponseRecordId;
    /**
     * The error code for an individual record result.
     */
    ErrorCode?: ErrorCode;
    /**
     * The error message for an individual record result.
     */
    ErrorMessage?: ErrorMessage;
  }
  export type PutRecordBatchResponseEntryList = PutRecordBatchResponseEntry[];
  export interface PutRecordInput {
    /**
     * The name of the delivery stream.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * The record.
     */
    Record: Record;
  }
  export interface PutRecordOutput {
    /**
     * The ID of the record.
     */
    RecordId: PutResponseRecordId;
  }
  export type PutResponseRecordId = string;
  export interface Record {
    /**
     * The data blob, which is base64-encoded when the blob is serialized. The maximum size of the data blob, before base64-encoding, is 1,000 KB.
     */
    Data: Data;
  }
  export interface RedshiftDestinationConfiguration {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN: RoleARN;
    /**
     * The database connection string.
     */
    ClusterJDBCURL: ClusterJDBCURL;
    /**
     * The COPY command.
     */
    CopyCommand: CopyCommand;
    /**
     * The name of the user.
     */
    Username: Username;
    /**
     * The user password.
     */
    Password: Password;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver documents to Amazon Redshift. Default value is 3600 (60 minutes).
     */
    RetryOptions?: RedshiftRetryOptions;
    /**
     * The configuration for the intermediate Amazon S3 location from which Amazon Redshift obtains data. Restrictions are described in the topic for CreateDeliveryStream. The compression formats SNAPPY or ZIP cannot be specified in RedshiftDestinationConfiguration.S3Configuration because the Amazon Redshift COPY operation that reads from the S3 bucket doesn't support these compression formats.
     */
    S3Configuration: S3DestinationConfiguration;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon S3 backup mode.
     */
    S3BackupMode?: RedshiftS3BackupMode;
    /**
     * The configuration for backup in Amazon S3.
     */
    S3BackupConfiguration?: S3DestinationConfiguration;
    /**
     * The CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface RedshiftDestinationDescription {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN: RoleARN;
    /**
     * The database connection string.
     */
    ClusterJDBCURL: ClusterJDBCURL;
    /**
     * The COPY command.
     */
    CopyCommand: CopyCommand;
    /**
     * The name of the user.
     */
    Username: Username;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver documents to Amazon Redshift. Default value is 3600 (60 minutes).
     */
    RetryOptions?: RedshiftRetryOptions;
    /**
     * The Amazon S3 destination.
     */
    S3DestinationDescription: S3DestinationDescription;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon S3 backup mode.
     */
    S3BackupMode?: RedshiftS3BackupMode;
    /**
     * The configuration for backup in Amazon S3.
     */
    S3BackupDescription?: S3DestinationDescription;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface RedshiftDestinationUpdate {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN?: RoleARN;
    /**
     * The database connection string.
     */
    ClusterJDBCURL?: ClusterJDBCURL;
    /**
     * The COPY command.
     */
    CopyCommand?: CopyCommand;
    /**
     * The name of the user.
     */
    Username?: Username;
    /**
     * The user password.
     */
    Password?: Password;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver documents to Amazon Redshift. Default value is 3600 (60 minutes).
     */
    RetryOptions?: RedshiftRetryOptions;
    /**
     * The Amazon S3 destination. The compression formats SNAPPY or ZIP cannot be specified in RedshiftDestinationUpdate.S3Update because the Amazon Redshift COPY operation that reads from the S3 bucket doesn't support these compression formats.
     */
    S3Update?: S3DestinationUpdate;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon S3 backup mode.
     */
    S3BackupMode?: RedshiftS3BackupMode;
    /**
     * The Amazon S3 destination for backup.
     */
    S3BackupUpdate?: S3DestinationUpdate;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export type RedshiftRetryDurationInSeconds = number;
  export interface RedshiftRetryOptions {
    /**
     * The length of time during which Kinesis Data Firehose retries delivery after a failure, starting from the initial request and including the first attempt. The default value is 3600 seconds (60 minutes). Kinesis Data Firehose does not retry if the value of DurationInSeconds is 0 (zero) or if the first delivery attempt takes longer than the current value.
     */
    DurationInSeconds?: RedshiftRetryDurationInSeconds;
  }
  export type RedshiftS3BackupMode = "Disabled"|"Enabled"|string;
  export type RoleARN = string;
  export type S3BackupMode = "Disabled"|"Enabled"|string;
  export interface S3DestinationConfiguration {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN: RoleARN;
    /**
     * The ARN of the S3 bucket. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    BucketARN: BucketARN;
    /**
     * The "YYYY/MM/DD/HH" time format prefix is automatically used for delivered Amazon S3 files. You can specify an extra prefix to be added in front of the time format prefix. If the prefix ends with a slash, it appears as a folder in the S3 bucket. For more information, see Amazon S3 Object Name Format in the Amazon Kinesis Data Firehose Developer Guide.
     */
    Prefix?: Prefix;
    /**
     * The buffering option. If no value is specified, BufferingHints object default values are used.
     */
    BufferingHints?: BufferingHints;
    /**
     * The compression format. If no value is specified, the default is UNCOMPRESSED. The compression formats SNAPPY or ZIP cannot be specified for Amazon Redshift destinations because they are not supported by the Amazon Redshift COPY operation that reads from the S3 bucket.
     */
    CompressionFormat?: CompressionFormat;
    /**
     * The encryption configuration. If no value is specified, the default is no encryption.
     */
    EncryptionConfiguration?: EncryptionConfiguration;
    /**
     * The CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface S3DestinationDescription {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN: RoleARN;
    /**
     * The ARN of the S3 bucket. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    BucketARN: BucketARN;
    /**
     * The "YYYY/MM/DD/HH" time format prefix is automatically used for delivered Amazon S3 files. You can specify an extra prefix to be added in front of the time format prefix. If the prefix ends with a slash, it appears as a folder in the S3 bucket. For more information, see Amazon S3 Object Name Format in the Amazon Kinesis Data Firehose Developer Guide.
     */
    Prefix?: Prefix;
    /**
     * The buffering option. If no value is specified, BufferingHints object default values are used.
     */
    BufferingHints: BufferingHints;
    /**
     * The compression format. If no value is specified, the default is UNCOMPRESSED.
     */
    CompressionFormat: CompressionFormat;
    /**
     * The encryption configuration. If no value is specified, the default is no encryption.
     */
    EncryptionConfiguration: EncryptionConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface S3DestinationUpdate {
    /**
     * The Amazon Resource Name (ARN) of the AWS credentials. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    RoleARN?: RoleARN;
    /**
     * The ARN of the S3 bucket. For more information, see Amazon Resource Names (ARNs) and AWS Service Namespaces.
     */
    BucketARN?: BucketARN;
    /**
     * The "YYYY/MM/DD/HH" time format prefix is automatically used for delivered Amazon S3 files. You can specify an extra prefix to be added in front of the time format prefix. If the prefix ends with a slash, it appears as a folder in the S3 bucket. For more information, see Amazon S3 Object Name Format in the Amazon Kinesis Data Firehose Developer Guide.
     */
    Prefix?: Prefix;
    /**
     * The buffering option. If no value is specified, BufferingHints object default values are used.
     */
    BufferingHints?: BufferingHints;
    /**
     * The compression format. If no value is specified, the default is UNCOMPRESSED. The compression formats SNAPPY or ZIP cannot be specified for Amazon Redshift destinations because they are not supported by the Amazon Redshift COPY operation that reads from the S3 bucket.
     */
    CompressionFormat?: CompressionFormat;
    /**
     * The encryption configuration. If no value is specified, the default is no encryption.
     */
    EncryptionConfiguration?: EncryptionConfiguration;
    /**
     * The CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface SchemaConfiguration {
    /**
     * The role that Kinesis Data Firehose can use to access AWS Glue. This role must be in the same account you use for Kinesis Data Firehose. Cross-account roles aren't allowed.
     */
    RoleARN?: NonEmptyStringWithoutWhitespace;
    /**
     * The ID of the AWS Glue Data Catalog. If you don't supply this, the AWS account ID is used by default.
     */
    CatalogId?: NonEmptyStringWithoutWhitespace;
    /**
     * Specifies the name of the AWS Glue database that contains the schema for the output data.
     */
    DatabaseName?: NonEmptyStringWithoutWhitespace;
    /**
     * Specifies the AWS Glue table that contains the column information that constitutes your data schema.
     */
    TableName?: NonEmptyStringWithoutWhitespace;
    /**
     * If you don't specify an AWS Region, the default is the current Region.
     */
    Region?: NonEmptyStringWithoutWhitespace;
    /**
     * Specifies the table version for the output data schema. If you don't specify this version ID, or if you set it to LATEST, Kinesis Data Firehose uses the most recent version. This means that any updates to the table are automatically picked up.
     */
    VersionId?: NonEmptyStringWithoutWhitespace;
  }
  export interface Serializer {
    /**
     * A serializer to use for converting data to the Parquet format before storing it in Amazon S3. For more information, see Apache Parquet.
     */
    ParquetSerDe?: ParquetSerDe;
    /**
     * A serializer to use for converting data to the ORC format before storing it in Amazon S3. For more information, see Apache ORC.
     */
    OrcSerDe?: OrcSerDe;
  }
  export type SizeInMBs = number;
  export interface SourceDescription {
    /**
     * The KinesisStreamSourceDescription value for the source Kinesis data stream.
     */
    KinesisStreamSourceDescription?: KinesisStreamSourceDescription;
  }
  export interface SplunkDestinationConfiguration {
    /**
     * The HTTP Event Collector (HEC) endpoint to which Kinesis Data Firehose sends your data.
     */
    HECEndpoint: HECEndpoint;
    /**
     * This type can be either "Raw" or "Event."
     */
    HECEndpointType: HECEndpointType;
    /**
     * This is a GUID that you obtain from your Splunk cluster when you create a new HEC endpoint.
     */
    HECToken: HECToken;
    /**
     * The amount of time that Kinesis Data Firehose waits to receive an acknowledgment from Splunk after it sends it data. At the end of the timeout period, Kinesis Data Firehose either tries to send the data again or considers it an error, based on your retry settings.
     */
    HECAcknowledgmentTimeoutInSeconds?: HECAcknowledgmentTimeoutInSeconds;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver data to Splunk, or if it doesn't receive an acknowledgment of receipt from Splunk.
     */
    RetryOptions?: SplunkRetryOptions;
    /**
     * Defines how documents should be delivered to Amazon S3. When set to FailedDocumentsOnly, Kinesis Data Firehose writes any data that could not be indexed to the configured Amazon S3 destination. When set to AllDocuments, Kinesis Data Firehose delivers all incoming records to Amazon S3, and also writes failed documents to Amazon S3. Default value is FailedDocumentsOnly. 
     */
    S3BackupMode?: SplunkS3BackupMode;
    /**
     * The configuration for the backup Amazon S3 location.
     */
    S3Configuration: S3DestinationConfiguration;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface SplunkDestinationDescription {
    /**
     * The HTTP Event Collector (HEC) endpoint to which Kinesis Data Firehose sends your data.
     */
    HECEndpoint?: HECEndpoint;
    /**
     * This type can be either "Raw" or "Event."
     */
    HECEndpointType?: HECEndpointType;
    /**
     * A GUID you obtain from your Splunk cluster when you create a new HEC endpoint.
     */
    HECToken?: HECToken;
    /**
     * The amount of time that Kinesis Data Firehose waits to receive an acknowledgment from Splunk after it sends it data. At the end of the timeout period, Kinesis Data Firehose either tries to send the data again or considers it an error, based on your retry settings.
     */
    HECAcknowledgmentTimeoutInSeconds?: HECAcknowledgmentTimeoutInSeconds;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver data to Splunk or if it doesn't receive an acknowledgment of receipt from Splunk.
     */
    RetryOptions?: SplunkRetryOptions;
    /**
     * Defines how documents should be delivered to Amazon S3. When set to FailedDocumentsOnly, Kinesis Data Firehose writes any data that could not be indexed to the configured Amazon S3 destination. When set to AllDocuments, Kinesis Data Firehose delivers all incoming records to Amazon S3, and also writes failed documents to Amazon S3. Default value is FailedDocumentsOnly. 
     */
    S3BackupMode?: SplunkS3BackupMode;
    /**
     * The Amazon S3 destination.&gt;
     */
    S3DestinationDescription?: S3DestinationDescription;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export interface SplunkDestinationUpdate {
    /**
     * The HTTP Event Collector (HEC) endpoint to which Kinesis Data Firehose sends your data.
     */
    HECEndpoint?: HECEndpoint;
    /**
     * This type can be either "Raw" or "Event."
     */
    HECEndpointType?: HECEndpointType;
    /**
     * A GUID that you obtain from your Splunk cluster when you create a new HEC endpoint.
     */
    HECToken?: HECToken;
    /**
     * The amount of time that Kinesis Data Firehose waits to receive an acknowledgment from Splunk after it sends data. At the end of the timeout period, Kinesis Data Firehose either tries to send the data again or considers it an error, based on your retry settings.
     */
    HECAcknowledgmentTimeoutInSeconds?: HECAcknowledgmentTimeoutInSeconds;
    /**
     * The retry behavior in case Kinesis Data Firehose is unable to deliver data to Splunk or if it doesn't receive an acknowledgment of receipt from Splunk.
     */
    RetryOptions?: SplunkRetryOptions;
    /**
     * Defines how documents should be delivered to Amazon S3. When set to FailedDocumentsOnly, Kinesis Data Firehose writes any data that could not be indexed to the configured Amazon S3 destination. When set to AllDocuments, Kinesis Data Firehose delivers all incoming records to Amazon S3, and also writes failed documents to Amazon S3. Default value is FailedDocumentsOnly. 
     */
    S3BackupMode?: SplunkS3BackupMode;
    /**
     * Your update to the configuration of the backup Amazon S3 location.
     */
    S3Update?: S3DestinationUpdate;
    /**
     * The data processing configuration.
     */
    ProcessingConfiguration?: ProcessingConfiguration;
    /**
     * The Amazon CloudWatch logging options for your delivery stream.
     */
    CloudWatchLoggingOptions?: CloudWatchLoggingOptions;
  }
  export type SplunkRetryDurationInSeconds = number;
  export interface SplunkRetryOptions {
    /**
     * The total amount of time that Kinesis Data Firehose spends on retries. This duration starts after the initial attempt to send data to Splunk fails. It doesn't include the periods during which Kinesis Data Firehose waits for acknowledgment from Splunk after each attempt.
     */
    DurationInSeconds?: SplunkRetryDurationInSeconds;
  }
  export type SplunkS3BackupMode = "FailedEventsOnly"|"AllEvents"|string;
  export interface Tag {
    /**
     * A unique identifier for the tag. Maximum length: 128 characters. Valid characters: Unicode letters, digits, white space, _ . / = + - % @
     */
    Key: TagKey;
    /**
     * An optional string, which you can use to describe or define the tag. Maximum length: 256 characters. Valid characters: Unicode letters, digits, white space, _ . / = + - % @
     */
    Value?: TagValue;
  }
  export interface TagDeliveryStreamInput {
    /**
     * The name of the delivery stream to which you want to add the tags.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * A set of key-value pairs to use to create the tags.
     */
    Tags: TagDeliveryStreamInputTagList;
  }
  export type TagDeliveryStreamInputTagList = Tag[];
  export interface TagDeliveryStreamOutput {
  }
  export type TagKey = string;
  export type TagKeyList = TagKey[];
  export type TagValue = string;
  export type Timestamp = Date;
  export interface UntagDeliveryStreamInput {
    /**
     * The name of the delivery stream.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * A list of tag keys. Each corresponding tag is removed from the delivery stream.
     */
    TagKeys: TagKeyList;
  }
  export interface UntagDeliveryStreamOutput {
  }
  export interface UpdateDestinationInput {
    /**
     * The name of the delivery stream.
     */
    DeliveryStreamName: DeliveryStreamName;
    /**
     * Obtain this value from the VersionId result of DeliveryStreamDescription. This value is required, and helps the service perform conditional operations. For example, if there is an interleaving update and this value is null, then the update destination fails. After the update is successful, the VersionId value is updated. The service then performs a merge of the old configuration with the new configuration.
     */
    CurrentDeliveryStreamVersionId: DeliveryStreamVersionId;
    /**
     * The ID of the destination.
     */
    DestinationId: DestinationId;
    /**
     * [Deprecated] Describes an update for a destination in Amazon S3.
     */
    S3DestinationUpdate?: S3DestinationUpdate;
    /**
     * Describes an update for a destination in Amazon S3.
     */
    ExtendedS3DestinationUpdate?: ExtendedS3DestinationUpdate;
    /**
     * Describes an update for a destination in Amazon Redshift.
     */
    RedshiftDestinationUpdate?: RedshiftDestinationUpdate;
    /**
     * Describes an update for a destination in Amazon ES.
     */
    ElasticsearchDestinationUpdate?: ElasticsearchDestinationUpdate;
    /**
     * Describes an update for a destination in Splunk.
     */
    SplunkDestinationUpdate?: SplunkDestinationUpdate;
  }
  export interface UpdateDestinationOutput {
  }
  export type Username = string;
  /**
   * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
   */
  export type apiVersion = "2015-08-04"|"latest"|string;
  export interface ClientApiVersions {
    /**
     * A string in YYYY-MM-DD format that represents the latest possible API version that can be used in this service. Specify 'latest' to use the latest possible version.
     */
    apiVersion?: apiVersion;
  }
  export type ClientConfiguration = ServiceConfigurationOptions & ClientApiVersions;
  /**
   * Contains interfaces for use with the Firehose client.
   */
  export import Types = Firehose;
}
export = Firehose;
