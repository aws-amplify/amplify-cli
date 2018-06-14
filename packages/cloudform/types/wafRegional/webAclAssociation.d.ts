import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface WebACLAssociationProperties {
    ResourceArn: Value<string>;
    WebACLId: Value<string>;
}
export default class WebACLAssociation extends ResourceBase {
    constructor(properties?: WebACLAssociationProperties);
}
