/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class RecordingGroup {
    AllSupported?: Value<boolean>
    IncludeGlobalResourceTypes?: Value<boolean>
    ResourceTypes?: List<Value<string>>

    constructor(properties: RecordingGroup) {
        Object.assign(this, properties)
    }
}

export interface ConfigurationRecorderProperties {
    Name?: Value<string>
    RecordingGroup?: RecordingGroup
    RoleARN: Value<string>
}

export default class ConfigurationRecorder extends ResourceBase {
    static RecordingGroup = RecordingGroup

    constructor(properties?: ConfigurationRecorderProperties) {
        super('AWS::Config::ConfigurationRecorder', properties)
    }
}
