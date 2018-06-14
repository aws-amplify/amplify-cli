/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ApplicationResourceLifecycleConfig {
    ServiceRole?: Value<string>
    VersionLifecycleConfig?: ApplicationVersionLifecycleConfig

    constructor(properties: ApplicationResourceLifecycleConfig) {
        Object.assign(this, properties)
    }
}

export class ApplicationVersionLifecycleConfig {
    MaxAgeRule?: MaxAgeRule
    MaxCountRule?: MaxCountRule

    constructor(properties: ApplicationVersionLifecycleConfig) {
        Object.assign(this, properties)
    }
}

export class MaxCountRule {
    DeleteSourceFromS3?: Value<boolean>
    Enabled?: Value<boolean>
    MaxCount?: Value<number>

    constructor(properties: MaxCountRule) {
        Object.assign(this, properties)
    }
}

export class MaxAgeRule {
    DeleteSourceFromS3?: Value<boolean>
    Enabled?: Value<boolean>
    MaxAgeInDays?: Value<number>

    constructor(properties: MaxAgeRule) {
        Object.assign(this, properties)
    }
}

export interface ApplicationProperties {
    ApplicationName?: Value<string>
    Description?: Value<string>
    ResourceLifecycleConfig?: ApplicationResourceLifecycleConfig
}

export default class Application extends ResourceBase {
    static ApplicationResourceLifecycleConfig = ApplicationResourceLifecycleConfig
    static ApplicationVersionLifecycleConfig = ApplicationVersionLifecycleConfig
    static MaxCountRule = MaxCountRule
    static MaxAgeRule = MaxAgeRule

    constructor(properties?: ApplicationProperties) {
        super('AWS::ElasticBeanstalk::Application', properties)
    }
}
