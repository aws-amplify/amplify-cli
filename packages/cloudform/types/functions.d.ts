import { Value, List, IntrinsicFunction, ConditionIntrinsicFunction, Condition } from "./dataTypes";
export declare function Base64(value: Value<string>): IntrinsicFunction;
export declare function FindInMap(mapName: Value<string>, topLevelKey: Value<string>, secondLevelKey: Value<string>): IntrinsicFunction;
export declare function GetAtt(logicalNameOfResource: Value<string>, attributeName: Value<string>): IntrinsicFunction;
export declare function GetAZs(region?: Value<string>): IntrinsicFunction;
export declare function ImportValue(sharedValueToImport: Value<any>): IntrinsicFunction;
export declare function Join(delimiter: Value<string>, values: List<any>): IntrinsicFunction;
export declare function Select(index: Value<number>, listOfObjects: List<any>): IntrinsicFunction;
export declare function Split(delimiter: Value<string>, sourceString: Value<string>): IntrinsicFunction;
export declare function Sub(string: Value<string>, vars: {
    [key: string]: Value<any>;
}): IntrinsicFunction;
export declare function Ref(logicalName: Value<string>): IntrinsicFunction;
export declare function And(conditions: List<Condition>): ConditionIntrinsicFunction;
export declare function Equals(left: any, right: any): ConditionIntrinsicFunction;
export declare function If(conditionName: Value<string>, valueIfTrue: any, valueIfFalse: any): ConditionIntrinsicFunction;
export declare function Not(condition: Condition): ConditionIntrinsicFunction;
export declare function Or(conditions: List<Condition>): ConditionIntrinsicFunction;
