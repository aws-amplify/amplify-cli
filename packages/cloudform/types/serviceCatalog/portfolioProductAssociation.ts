/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PortfolioProductAssociationProperties {
    SourcePortfolioId?: Value<string>
    AcceptLanguage?: Value<string>
    PortfolioId: Value<string>
    ProductId: Value<string>
}

export default class PortfolioProductAssociation extends ResourceBase {


    constructor(properties?: PortfolioProductAssociationProperties) {
        super('AWS::ServiceCatalog::PortfolioProductAssociation', properties)
    }
}
