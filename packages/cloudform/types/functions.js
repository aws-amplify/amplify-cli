"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataTypes_1 = require("./dataTypes");
function Base64(value) {
    return new dataTypes_1.IntrinsicFunction('Fn::Base64', value);
}
exports.Base64 = Base64;
function FindInMap(mapName, topLevelKey, secondLevelKey) {
    return new dataTypes_1.IntrinsicFunction('Fn::FindInMap', [mapName, topLevelKey, secondLevelKey]);
}
exports.FindInMap = FindInMap;
function GetAtt(logicalNameOfResource, attributeName) {
    return new dataTypes_1.IntrinsicFunction('Fn::GetAtt', [logicalNameOfResource, attributeName]);
}
exports.GetAtt = GetAtt;
function GetAZs(region = '') {
    return new dataTypes_1.IntrinsicFunction('Fn::GetAZs', region);
}
exports.GetAZs = GetAZs;
function ImportValue(sharedValueToImport) {
    return new dataTypes_1.IntrinsicFunction('Fn::ImportValue', sharedValueToImport);
}
exports.ImportValue = ImportValue;
function Join(delimiter, values) {
    return new dataTypes_1.IntrinsicFunction('Fn::Join', [delimiter, values]);
}
exports.Join = Join;
function Select(index, listOfObjects) {
    return new dataTypes_1.IntrinsicFunction('Fn::Select', [index, listOfObjects]);
}
exports.Select = Select;
function Split(delimiter, sourceString) {
    return new dataTypes_1.IntrinsicFunction('Fn::Split', [delimiter, sourceString]);
}
exports.Split = Split;
function Sub(string, vars) {
    return new dataTypes_1.IntrinsicFunction('Fn::Sub', [string, vars]);
}
exports.Sub = Sub;
function Ref(logicalName) {
    return new dataTypes_1.IntrinsicFunction('Ref', logicalName);
}
exports.Ref = Ref;
function And(conditions) {
    return new dataTypes_1.ConditionIntrinsicFunction('Fn::And', conditions);
}
exports.And = And;
function Equals(left, right) {
    return new dataTypes_1.ConditionIntrinsicFunction('Fn::Equals', [left, right]);
}
exports.Equals = Equals;
function If(conditionName, valueIfTrue, valueIfFalse) {
    return new dataTypes_1.ConditionIntrinsicFunction('Fn::If', [conditionName, valueIfTrue, valueIfFalse]);
}
exports.If = If;
function Not(condition) {
    return new dataTypes_1.ConditionIntrinsicFunction('Fn::Not', [condition]);
}
exports.Not = Not;
function Or(conditions) {
    return new dataTypes_1.ConditionIntrinsicFunction('Fn::Or', conditions);
}
exports.Or = Or;
