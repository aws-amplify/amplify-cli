import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface MasterProperties {
    DetectorId: Value<string>;
    MasterId: Value<string>;
    InvitationId: Value<string>;
}
export default class Master extends ResourceBase {
    constructor(properties?: MasterProperties);
}
