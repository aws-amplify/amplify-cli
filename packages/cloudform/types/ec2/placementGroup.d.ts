import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PlacementGroupProperties {
    Strategy?: Value<string>;
}
export default class PlacementGroup extends ResourceBase {
    constructor(properties?: PlacementGroupProperties);
}
