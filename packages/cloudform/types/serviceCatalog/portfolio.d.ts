import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface PortfolioProperties {
    ProviderName: Value<string>;
    Description?: Value<string>;
    DisplayName: Value<string>;
    AcceptLanguage?: Value<string>;
    Tags?: ResourceTag[];
}
export default class Portfolio extends ResourceBase {
    constructor(properties?: PortfolioProperties);
}
