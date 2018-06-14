/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PortfolioPrincipalAssociationProperties {
    PrincipalARN: Value<string>
    AcceptLanguage?: Value<string>
    PortfolioId: Value<string>
    PrincipalType: Value<string>
}

export default class PortfolioPrincipalAssociation extends ResourceBase {


    constructor(properties?: PortfolioPrincipalAssociationProperties) {
        super('AWS::ServiceCatalog::PortfolioPrincipalAssociation', properties)
    }
}
