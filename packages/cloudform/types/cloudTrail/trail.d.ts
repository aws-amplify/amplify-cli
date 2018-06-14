import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class EventSelector {
    DataResources?: List<DataResource>;
    IncludeManagementEvents?: Value<boolean>;
    ReadWriteType?: Value<string>;
    constructor(properties: EventSelector);
}
export declare class DataResource {
    Type: Value<string>;
    Values?: List<Value<string>>;
    constructor(properties: DataResource);
}
export interface TrailProperties {
    CloudWatchLogsLogGroupArn?: Value<string>;
    CloudWatchLogsRoleArn?: Value<string>;
    EnableLogFileValidation?: Value<boolean>;
    EventSelectors?: List<EventSelector>;
    IncludeGlobalServiceEvents?: Value<boolean>;
    IsLogging: Value<boolean>;
    IsMultiRegionTrail?: Value<boolean>;
    KMSKeyId?: Value<string>;
    S3BucketName: Value<string>;
    S3KeyPrefix?: Value<string>;
    SnsTopicName?: Value<string>;
    Tags?: ResourceTag[];
    TrailName?: Value<string>;
}
export default class Trail extends ResourceBase {
    static EventSelector: typeof EventSelector;
    static DataResource: typeof DataResource;
    constructor(properties?: TrailProperties);
}
