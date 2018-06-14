/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PortfolioShareProperties {
    AccountId: Value<string>
    AcceptLanguage?: Value<string>
    PortfolioId: Value<string>
}

export default class PortfolioShare extends ResourceBase {


    constructor(properties?: PortfolioShareProperties) {
        super('AWS::ServiceCatalog::PortfolioShare', properties)
    }
}
