"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parseMessyTime = require("parse-messy-time");
class CommaSeparatedStrings extends Array {
    constructor(...args) {
        super(...args);
    }
    static cast(line) {
        let values = line
            .split(',')
            .map(str => str.trim())
            .filter(str => !!str);
        return new this(...values);
    }
}
exports.CommaSeparatedStrings = CommaSeparatedStrings;
class CastableDate extends Date {
    constructor(str) {
        super(parseMessyTime(str, { now: Math.round(Date.now() / 1000) * 1000 }));
    }
    toDate() {
        return new Date(this.getTime());
    }
    static cast(str) {
        return new this(str);
    }
}
exports.Date = CastableDate;
exports.CastableDate = CastableDate;
//# sourceMappingURL=miscellaneous.js.map