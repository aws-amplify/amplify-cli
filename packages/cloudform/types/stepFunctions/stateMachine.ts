/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface StateMachineProperties {
    DefinitionString: Value<string>
    StateMachineName?: Value<string>
    RoleArn: Value<string>
}

export default class StateMachine extends ResourceBase {


    constructor(properties?: StateMachineProperties) {
        super('AWS::StepFunctions::StateMachine', properties)
    }
}
