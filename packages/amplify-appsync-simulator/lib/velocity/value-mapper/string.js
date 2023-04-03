"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaString = void 0;
const array_1 = require("./array");
const integer_1 = require("./integer");
class JavaString {
    constructor(str) {
        this.value = str;
    }
    concat(str) {
        return new JavaString(this.value.concat(str.toString()));
    }
    contains(str) {
        return this.value.indexOf(str.toString()) !== -1;
    }
    endsWith(suffix) {
        return this.value.endsWith(suffix.toString());
    }
    equals(str) {
        return this.value === str.toString();
    }
    indexOf(val, fromIndex = 0) {
        return new integer_1.JavaInteger(this.value.indexOf(val.toString(), fromIndex));
    }
    isEmpty() {
        return this.value.length === 0;
    }
    lastIndexOf(val, fromIndex = Infinity) {
        return new integer_1.JavaInteger(this.value.lastIndexOf(val.toString(), fromIndex));
    }
    replace(find, replace) {
        return this.replaceAll(find, replace);
    }
    replaceAll(find, replace) {
        const rep = this.value.replace(new RegExp(find, 'g'), replace);
        return new JavaString(rep);
    }
    replaceFirst(find, replace) {
        const rep = this.value.replace(new RegExp(find), replace);
        return new JavaString(rep);
    }
    matches(regexString) {
        const re = new RegExp(regexString.toString());
        return this.value.match(re) !== null;
    }
    split(regexString, limit = undefined) {
        const testRe = new RegExp(`${regexString.toString()}|`);
        const numberOfGroups = ''.match(testRe).length;
        const re = new RegExp(regexString.toString());
        const result = this.value.split(re, limit).filter((v, ii) => !(ii % numberOfGroups));
        return new array_1.JavaArray(result, (e) => new JavaString(e.toString()));
    }
    startsWith(prefix, offset = 0) {
        return this.value.startsWith(prefix.toString(), offset);
    }
    substring(beginIndex, endIndex = Infinity) {
        return this.value.substring(beginIndex, endIndex);
    }
    toJSON() {
        return this.toString();
    }
    toLowerCase() {
        return new JavaString(this.value.toLowerCase());
    }
    toUpperCase() {
        return new JavaString(this.value.toUpperCase());
    }
    toString() {
        return this.value;
    }
    toIdString() {
        return this.value;
    }
    trim() {
        return new JavaString(this.value.trim());
    }
    length() {
        return new integer_1.JavaInteger(this.value && this.value.length);
    }
    toJson() {
        return this.value;
    }
}
exports.JavaString = JavaString;
//# sourceMappingURL=string.js.map