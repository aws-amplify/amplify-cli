import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface VersionProperties {
    CodeSha256?: Value<string>;
    Description?: Value<string>;
    FunctionName: Value<string>;
}
export default class Version extends ResourceBase {
    constructor(properties?: VersionProperties);
}
