/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface LaunchTemplateConstraintProperties {
    Description?: Value<string>
    AcceptLanguage?: Value<string>
    PortfolioId: Value<string>
    ProductId: Value<string>
    Rules: Value<string>
}

export default class LaunchTemplateConstraint extends ResourceBase {


    constructor(properties?: LaunchTemplateConstraintProperties) {
        super('AWS::ServiceCatalog::LaunchTemplateConstraint', properties)
    }
}
