import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface TagOptionAssociationProperties {
    TagOptionId: Value<string>;
    ResourceId: Value<string>;
}
export default class TagOptionAssociation extends ResourceBase {
    constructor(properties?: TagOptionAssociationProperties);
}
