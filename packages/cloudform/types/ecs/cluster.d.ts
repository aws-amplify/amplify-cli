import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ClusterProperties {
    ClusterName?: Value<string>;
}
export default class Cluster extends ResourceBase {
    constructor(properties?: ClusterProperties);
}
