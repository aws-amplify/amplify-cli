/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ApiStage {
    ApiId?: Value<string>
    Stage?: Value<string>

    constructor(properties: ApiStage) {
        Object.assign(this, properties)
    }
}

export class ThrottleSettings {
    BurstLimit?: Value<number>
    RateLimit?: Value<number>

    constructor(properties: ThrottleSettings) {
        Object.assign(this, properties)
    }
}

export class QuotaSettings {
    Limit?: Value<number>
    Offset?: Value<number>
    Period?: Value<string>

    constructor(properties: QuotaSettings) {
        Object.assign(this, properties)
    }
}

export interface UsagePlanProperties {
    ApiStages?: List<ApiStage>
    Description?: Value<string>
    Quota?: QuotaSettings
    Throttle?: ThrottleSettings
    UsagePlanName?: Value<string>
}

export default class UsagePlan extends ResourceBase {
    static ApiStage = ApiStage
    static ThrottleSettings = ThrottleSettings
    static QuotaSettings = QuotaSettings

    constructor(properties?: UsagePlanProperties) {
        super('AWS::ApiGateway::UsagePlan', properties)
    }
}
