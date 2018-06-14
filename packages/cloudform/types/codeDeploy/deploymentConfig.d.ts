import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class MinimumHealthyHosts {
    Type: Value<string>;
    Value: Value<number>;
    constructor(properties: MinimumHealthyHosts);
}
export interface DeploymentConfigProperties {
    DeploymentConfigName?: Value<string>;
    MinimumHealthyHosts?: MinimumHealthyHosts;
}
export default class DeploymentConfig extends ResourceBase {
    static MinimumHealthyHosts: typeof MinimumHealthyHosts;
    constructor(properties?: DeploymentConfigProperties);
}
