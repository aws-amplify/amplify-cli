/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface LaunchNotificationConstraintProperties {
    Description?: Value<string>
    NotificationArns: List<Value<string>>
    AcceptLanguage?: Value<string>
    PortfolioId: Value<string>
    ProductId: Value<string>
}

export default class LaunchNotificationConstraint extends ResourceBase {


    constructor(properties?: LaunchNotificationConstraintProperties) {
        super('AWS::ServiceCatalog::LaunchNotificationConstraint', properties)
    }
}
