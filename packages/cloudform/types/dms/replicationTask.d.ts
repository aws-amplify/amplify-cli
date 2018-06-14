import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface ReplicationTaskProperties {
    ReplicationTaskSettings?: Value<string>;
    TableMappings: Value<string>;
    ReplicationTaskIdentifier?: Value<string>;
    SourceEndpointArn: Value<string>;
    MigrationType: Value<string>;
    TargetEndpointArn: Value<string>;
    ReplicationInstanceArn: Value<string>;
    Tags?: ResourceTag[];
    CdcStartTime?: Value<number>;
}
export default class ReplicationTask extends ResourceBase {
    constructor(properties?: ReplicationTaskProperties);
}
