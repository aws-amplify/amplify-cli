import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PortfolioProductAssociationProperties {
    SourcePortfolioId?: Value<string>;
    AcceptLanguage?: Value<string>;
    PortfolioId: Value<string>;
    ProductId: Value<string>;
}
export default class PortfolioProductAssociation extends ResourceBase {
    constructor(properties?: PortfolioProductAssociationProperties);
}
