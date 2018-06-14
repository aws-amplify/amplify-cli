/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class SourceConfiguration {
    ApplicationName: Value<string>
    TemplateName: Value<string>

    constructor(properties: SourceConfiguration) {
        Object.assign(this, properties)
    }
}

export class ConfigurationOptionSetting {
    Namespace: Value<string>
    OptionName: Value<string>
    ResourceName?: Value<string>
    Value?: Value<string>

    constructor(properties: ConfigurationOptionSetting) {
        Object.assign(this, properties)
    }
}

export interface ConfigurationTemplateProperties {
    ApplicationName: Value<string>
    Description?: Value<string>
    EnvironmentId?: Value<string>
    OptionSettings?: List<ConfigurationOptionSetting>
    PlatformArn?: Value<string>
    SolutionStackName?: Value<string>
    SourceConfiguration?: SourceConfiguration
}

export default class ConfigurationTemplate extends ResourceBase {
    static SourceConfiguration = SourceConfiguration
    static ConfigurationOptionSetting = ConfigurationOptionSetting

    constructor(properties?: ConfigurationTemplateProperties) {
        super('AWS::ElasticBeanstalk::ConfigurationTemplate', properties)
    }
}
