import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface StateMachineProperties {
    DefinitionString: Value<string>;
    StateMachineName?: Value<string>;
    RoleArn: Value<string>;
}
export default class StateMachine extends ResourceBase {
    constructor(properties?: StateMachineProperties);
}
