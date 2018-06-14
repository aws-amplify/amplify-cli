import DataType from "./dataTypes"

export default interface Parameter {
    AllowedPattern?: string
    AllowedValues?: any[]
    ConstraintDescription?: string
    Default?: any
    Description?: string
    MaxLength?: number
    MaxValue?: number
    MinLength?: number
    MinValue?: number
    NoEcho?: boolean
    Type: DataType | string
}

export interface StringParameterProperties {
    AllowedPattern?: string
    AllowedValues?: string[]
    ConstraintDescription?: string
    Default?: string
    Description?: string
    MaxLength?: number
    MinLength?: number
    NoEcho?: boolean
}

export abstract class StringParameterBase implements Parameter {
    AllowedPattern?: string
    AllowedValues?: string[]
    ConstraintDescription?: string
    Default?: string
    Description?: string
    MaxLength?: number
    MinLength?: number
    NoEcho?: boolean

    constructor(public Type: DataType, properties?: StringParameterProperties) {
        Object.assign(this, properties)
    }
}

export class StringParameter extends StringParameterBase {
    constructor(properties?: StringParameterProperties) {
        super(DataType.String, properties)
    }
}

export class CommaDelimitedListParameter extends StringParameterBase {
    constructor(properties?: StringParameterProperties) {
        super(DataType.CommaDelimitedList, properties)
    }
}

export interface NumberParameterProperties {
    AllowedValues?: number[]
    ConstraintDescription?: string
    Default?: number
    Description?: string
    MaxValue?: number
    MinValue?: number
    NoEcho?: boolean
}

export abstract class NumberParameterBase implements Parameter {
    AllowedValues?: number[]
    ConstraintDescription?: string
    Default?: number
    Description?: string
    MaxValue?: number
    MinValue?: number
    NoEcho?: boolean

    constructor(public Type: DataType, properties?: NumberParameterProperties) {
        Object.assign(this, properties)
    }
}

export class NumberParameter extends NumberParameterBase {
    constructor(properties?: NumberParameterProperties) {
        super(DataType.Number, properties)
    }
}

export class ListOfNumbersParameter extends NumberParameterBase {
    constructor(properties?: NumberParameterProperties) {
        super(DataType.ListOfNumbers, properties)
    }
}
