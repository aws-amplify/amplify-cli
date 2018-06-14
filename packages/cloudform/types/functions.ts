import {Value, List, IntrinsicFunction, ConditionIntrinsicFunction, Condition} from "./dataTypes"

export function Base64(value: Value<string>) {
    return new IntrinsicFunction('Fn::Base64', value)
}

export function FindInMap(mapName: Value<string>, topLevelKey: Value<string>, secondLevelKey: Value<string>) {
    return new IntrinsicFunction('Fn::FindInMap', [mapName, topLevelKey, secondLevelKey])
}

export function GetAtt(logicalNameOfResource: Value<string>, attributeName: Value<string>) {
    return new IntrinsicFunction('Fn::GetAtt', [logicalNameOfResource, attributeName])
}

export function GetAZs(region: Value<string> = '') {
    return new IntrinsicFunction('Fn::GetAZs', region)
}

export function ImportValue(sharedValueToImport: Value<any>) {
    return new IntrinsicFunction('Fn::ImportValue', sharedValueToImport)
}

export function Join(delimiter: Value<string>, values: List<any>) {
    return new IntrinsicFunction('Fn::Join', [delimiter, values])
}

export function Select(index: Value<number>, listOfObjects: List<any>) {
    return new IntrinsicFunction('Fn::Select', [index, listOfObjects])
}

export function Split(delimiter: Value<string>, sourceString: Value<string>) {
    return new IntrinsicFunction('Fn::Split', [delimiter, sourceString])
}

export function Sub(string: Value<string>, vars: { [key: string]: Value<any> }) {
    return new IntrinsicFunction('Fn::Sub', [string, vars])
}

export function Ref(logicalName: Value<string>) {
    return new IntrinsicFunction('Ref', logicalName)
}

export function And(conditions: List<Condition>) {
    return new ConditionIntrinsicFunction('Fn::And', conditions)
}

export function Equals(left: any, right: any) {
    return new ConditionIntrinsicFunction('Fn::Equals', [left, right])
}

export function If(conditionName: Value<string>, valueIfTrue: any, valueIfFalse: any) {
    return new ConditionIntrinsicFunction('Fn::If', [conditionName, valueIfTrue, valueIfFalse])
}

export function Not(condition: Condition) {
    return new ConditionIntrinsicFunction('Fn::Not', [condition])
}

export function Or(conditions: List<Condition>) {
    return new ConditionIntrinsicFunction('Fn::Or', conditions)
}
