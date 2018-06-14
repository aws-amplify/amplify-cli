/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface AcceptedPortfolioShareProperties {
    AcceptLanguage?: Value<string>
    PortfolioId: Value<string>
}

export default class AcceptedPortfolioShare extends ResourceBase {


    constructor(properties?: AcceptedPortfolioShareProperties) {
        super('AWS::ServiceCatalog::AcceptedPortfolioShare', properties)
    }
}
