import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class RecordingGroup {
    AllSupported?: Value<boolean>;
    IncludeGlobalResourceTypes?: Value<boolean>;
    ResourceTypes?: List<Value<string>>;
    constructor(properties: RecordingGroup);
}
export interface ConfigurationRecorderProperties {
    Name?: Value<string>;
    RecordingGroup?: RecordingGroup;
    RoleARN: Value<string>;
}
export default class ConfigurationRecorder extends ResourceBase {
    static RecordingGroup: typeof RecordingGroup;
    constructor(properties?: ConfigurationRecorderProperties);
}
