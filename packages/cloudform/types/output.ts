import {Value, Condition} from "./dataTypes"

export default interface Output {
    Description?: Value<string>
    Value: any
    Export?: {
        Name: Value<string>
    }
    Condition?: Condition
}
