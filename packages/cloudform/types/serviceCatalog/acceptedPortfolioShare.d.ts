import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface AcceptedPortfolioShareProperties {
    AcceptLanguage?: Value<string>;
    PortfolioId: Value<string>;
}
export default class AcceptedPortfolioShare extends ResourceBase {
    constructor(properties?: AcceptedPortfolioShareProperties);
}
