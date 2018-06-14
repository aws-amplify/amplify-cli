/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Scope {
    ComplianceResourceId?: Value<string>
    ComplianceResourceTypes?: List<Value<string>>
    TagKey?: Value<string>
    TagValue?: Value<string>

    constructor(properties: Scope) {
        Object.assign(this, properties)
    }
}

export class Source {
    Owner: Value<string>
    SourceDetails?: List<SourceDetail>
    SourceIdentifier: Value<string>

    constructor(properties: Source) {
        Object.assign(this, properties)
    }
}

export class SourceDetail {
    EventSource: Value<string>
    MaximumExecutionFrequency?: Value<string>
    MessageType: Value<string>

    constructor(properties: SourceDetail) {
        Object.assign(this, properties)
    }
}

export interface ConfigRuleProperties {
    ConfigRuleName?: Value<string>
    Description?: Value<string>
    InputParameters?: any
    MaximumExecutionFrequency?: Value<string>
    Scope?: Scope
    Source: Source
}

export default class ConfigRule extends ResourceBase {
    static Scope = Scope
    static Source = Source
    static SourceDetail = SourceDetail

    constructor(properties?: ConfigRuleProperties) {
        super('AWS::Config::ConfigRule', properties)
    }
}
