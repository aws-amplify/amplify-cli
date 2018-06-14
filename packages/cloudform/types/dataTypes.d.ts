declare enum DataType {
    String = "String",
    Number = "Number",
    ListOfNumbers = "List<Number>",
    CommaDelimitedList = "CommaDelimitedList"
}
export default DataType;
export declare class IntrinsicFunction {
    private name;
    private payload;
    constructor(name: string, payload: any);
    toJSON(): {
        [x: string]: any;
    };
}
export declare class ConditionIntrinsicFunction extends IntrinsicFunction {
    constructor(name: string, payload: any);
}
export declare type Value<T> = T | IntrinsicFunction;
export declare type List<T> = T[] | IntrinsicFunction;
export declare type Condition = ConditionIntrinsicFunction | {
    Condition: Value<string>;
};
