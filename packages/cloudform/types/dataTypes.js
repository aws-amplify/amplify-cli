"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DataType;
(function (DataType) {
    DataType["String"] = "String";
    DataType["Number"] = "Number";
    DataType["ListOfNumbers"] = "List<Number>";
    DataType["CommaDelimitedList"] = "CommaDelimitedList";
})(DataType || (DataType = {}));
exports.default = DataType;
class IntrinsicFunction {
    constructor(name, payload) {
        this.name = name;
        this.payload = payload;
    }
    toJSON() {
        return { [this.name]: this.payload };
    }
}
exports.IntrinsicFunction = IntrinsicFunction;
class ConditionIntrinsicFunction extends IntrinsicFunction {
    constructor(name, payload) {
        super(name, payload);
    }
}
exports.ConditionIntrinsicFunction = ConditionIntrinsicFunction;
