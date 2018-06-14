/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Settings {
    EntityUrlTemplate?: Value<string>
    ExecutionUrlTemplate?: Value<string>
    RevisionUrlTemplate?: Value<string>
    ThirdPartyConfigurationUrl?: Value<string>

    constructor(properties: Settings) {
        Object.assign(this, properties)
    }
}

export class ArtifactDetails {
    MaximumCount: Value<number>
    MinimumCount: Value<number>

    constructor(properties: ArtifactDetails) {
        Object.assign(this, properties)
    }
}

export class ConfigurationProperties {
    Description?: Value<string>
    Key: Value<boolean>
    Name: Value<string>
    Queryable?: Value<boolean>
    Required: Value<boolean>
    Secret: Value<boolean>
    Type?: Value<string>

    constructor(properties: ConfigurationProperties) {
        Object.assign(this, properties)
    }
}

export interface CustomActionTypeProperties {
    Category: Value<string>
    ConfigurationProperties?: List<ConfigurationProperties>
    InputArtifactDetails: ArtifactDetails
    OutputArtifactDetails: ArtifactDetails
    Provider: Value<string>
    Settings?: Settings
    Version?: Value<string>
}

export default class CustomActionType extends ResourceBase {
    static Settings = Settings
    static ArtifactDetails = ArtifactDetails
    static ConfigurationProperties = ConfigurationProperties

    constructor(properties?: CustomActionTypeProperties) {
        super('AWS::CodePipeline::CustomActionType', properties)
    }
}
