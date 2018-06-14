/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface LaunchRoleConstraintProperties {
    Description?: Value<string>
    AcceptLanguage?: Value<string>
    PortfolioId: Value<string>
    ProductId: Value<string>
    RoleArn: Value<string>
}

export default class LaunchRoleConstraint extends ResourceBase {


    constructor(properties?: LaunchRoleConstraintProperties) {
        super('AWS::ServiceCatalog::LaunchRoleConstraint', properties)
    }
}
