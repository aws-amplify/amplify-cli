import { ResourceBase, ResourceTag } from '../resource';
import { List } from '../dataTypes';
export interface ResourceGroupProperties {
    ResourceGroupTags: List<ResourceTag>;
}
export default class ResourceGroup extends ResourceBase {
    constructor(properties?: ResourceGroupProperties);
}
