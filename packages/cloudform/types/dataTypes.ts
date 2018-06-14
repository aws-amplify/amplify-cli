enum DataType {
    String = 'String',
    Number = 'Number',
    ListOfNumbers = 'List<Number>',
    CommaDelimitedList = 'CommaDelimitedList'
}

export default DataType

export class IntrinsicFunction {
    constructor(private name: string, private payload: any) {
    }

    toJSON() {
        return {[this.name]: this.payload}
    }
}

export class ConditionIntrinsicFunction extends IntrinsicFunction {
    constructor(name: string, payload: any) {
        super(name, payload)
    }
}

export type Value<T> = T | IntrinsicFunction
export type List<T> = T[] | IntrinsicFunction
export type Condition = ConditionIntrinsicFunction | { Condition: Value<string> }