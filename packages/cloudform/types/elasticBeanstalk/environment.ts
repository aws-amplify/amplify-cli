/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class OptionSetting {
    Namespace: Value<string>
    OptionName: Value<string>
    ResourceName?: Value<string>
    Value?: Value<string>

    constructor(properties: OptionSetting) {
        Object.assign(this, properties)
    }
}

export class Tier {
    Name?: Value<string>
    Type?: Value<string>
    Version?: Value<string>

    constructor(properties: Tier) {
        Object.assign(this, properties)
    }
}

export interface EnvironmentProperties {
    ApplicationName: Value<string>
    CNAMEPrefix?: Value<string>
    Description?: Value<string>
    EnvironmentName?: Value<string>
    OptionSettings?: List<OptionSetting>
    PlatformArn?: Value<string>
    SolutionStackName?: Value<string>
    Tags?: ResourceTag[]
    TemplateName?: Value<string>
    Tier?: Tier
    VersionLabel?: Value<string>
}

export default class Environment extends ResourceBase {
    static OptionSetting = OptionSetting
    static Tier = Tier

    constructor(properties?: EnvironmentProperties) {
        super('AWS::ElasticBeanstalk::Environment', properties)
    }
}
