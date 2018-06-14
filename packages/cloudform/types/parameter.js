"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataTypes_1 = require("./dataTypes");
class StringParameterBase {
    constructor(Type, properties) {
        this.Type = Type;
        Object.assign(this, properties);
    }
}
exports.StringParameterBase = StringParameterBase;
class StringParameter extends StringParameterBase {
    constructor(properties) {
        super(dataTypes_1.default.String, properties);
    }
}
exports.StringParameter = StringParameter;
class CommaDelimitedListParameter extends StringParameterBase {
    constructor(properties) {
        super(dataTypes_1.default.CommaDelimitedList, properties);
    }
}
exports.CommaDelimitedListParameter = CommaDelimitedListParameter;
class NumberParameterBase {
    constructor(Type, properties) {
        this.Type = Type;
        Object.assign(this, properties);
    }
}
exports.NumberParameterBase = NumberParameterBase;
class NumberParameter extends NumberParameterBase {
    constructor(properties) {
        super(dataTypes_1.default.Number, properties);
    }
}
exports.NumberParameter = NumberParameter;
class ListOfNumbersParameter extends NumberParameterBase {
    constructor(properties) {
        super(dataTypes_1.default.ListOfNumbers, properties);
    }
}
exports.ListOfNumbersParameter = ListOfNumbersParameter;
