import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface LaunchRoleConstraintProperties {
    Description?: Value<string>;
    AcceptLanguage?: Value<string>;
    PortfolioId: Value<string>;
    ProductId: Value<string>;
    RoleArn: Value<string>;
}
export default class LaunchRoleConstraint extends ResourceBase {
    constructor(properties?: LaunchRoleConstraintProperties);
}
