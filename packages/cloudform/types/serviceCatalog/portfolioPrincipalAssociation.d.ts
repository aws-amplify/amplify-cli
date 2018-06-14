import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PortfolioPrincipalAssociationProperties {
    PrincipalARN: Value<string>;
    AcceptLanguage?: Value<string>;
    PortfolioId: Value<string>;
    PrincipalType: Value<string>;
}
export default class PortfolioPrincipalAssociation extends ResourceBase {
    constructor(properties?: PortfolioPrincipalAssociationProperties);
}
