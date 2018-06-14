/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class EventSelector {
    DataResources?: List<DataResource>
    IncludeManagementEvents?: Value<boolean>
    ReadWriteType?: Value<string>

    constructor(properties: EventSelector) {
        Object.assign(this, properties)
    }
}

export class DataResource {
    Type: Value<string>
    Values?: List<Value<string>>

    constructor(properties: DataResource) {
        Object.assign(this, properties)
    }
}

export interface TrailProperties {
    CloudWatchLogsLogGroupArn?: Value<string>
    CloudWatchLogsRoleArn?: Value<string>
    EnableLogFileValidation?: Value<boolean>
    EventSelectors?: List<EventSelector>
    IncludeGlobalServiceEvents?: Value<boolean>
    IsLogging: Value<boolean>
    IsMultiRegionTrail?: Value<boolean>
    KMSKeyId?: Value<string>
    S3BucketName: Value<string>
    S3KeyPrefix?: Value<string>
    SnsTopicName?: Value<string>
    Tags?: ResourceTag[]
    TrailName?: Value<string>
}

export default class Trail extends ResourceBase {
    static EventSelector = EventSelector
    static DataResource = DataResource

    constructor(properties?: TrailProperties) {
        super('AWS::CloudTrail::Trail', properties)
    }
}
