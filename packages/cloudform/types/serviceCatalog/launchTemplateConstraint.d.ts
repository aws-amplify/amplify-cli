import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface LaunchTemplateConstraintProperties {
    Description?: Value<string>;
    AcceptLanguage?: Value<string>;
    PortfolioId: Value<string>;
    ProductId: Value<string>;
    Rules: Value<string>;
}
export default class LaunchTemplateConstraint extends ResourceBase {
    constructor(properties?: LaunchTemplateConstraintProperties);
}
