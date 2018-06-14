/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface PortfolioProperties {
    ProviderName: Value<string>
    Description?: Value<string>
    DisplayName: Value<string>
    AcceptLanguage?: Value<string>
    Tags?: ResourceTag[]
}

export default class Portfolio extends ResourceBase {


    constructor(properties?: PortfolioProperties) {
        super('AWS::ServiceCatalog::Portfolio', properties)
    }
}
