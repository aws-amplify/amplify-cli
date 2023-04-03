"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const integer_1 = require("../../../velocity/value-mapper/integer");
const string_1 = require("../../../velocity/value-mapper/string");
describe('JavaInteger', () => {
    it('valueOf()', () => {
        const val1 = new integer_1.JavaInteger(5);
        const val2 = new integer_1.JavaInteger(3.14159);
        expect(val1 + val2).toEqual(8);
    });
    it('toJSON()', () => {
        const val = new integer_1.JavaInteger(42);
        expect(val.toJSON()).toEqual(42);
        expect(JSON.stringify(val)).toEqual('42');
    });
    it('toString()', () => {
        const val = new integer_1.JavaInteger(55);
        expect(val.toString()).toEqual('55');
        expect(val + '').toEqual('55');
    });
    it('parseInt()', () => {
        const val = new integer_1.JavaInteger(1);
        expect(val.parseInt('15').valueOf()).toEqual(15);
        expect(val.parseInt('f', 16).valueOf()).toEqual(15);
        expect(val.parseInt(new integer_1.JavaInteger(99)).valueOf()).toEqual(99);
        expect(val.parseInt(new string_1.JavaString('123')).valueOf()).toEqual(123);
        expect(val.parseInt(new string_1.JavaString('e'), new integer_1.JavaInteger(16)).valueOf()).toEqual(14);
    });
});
//# sourceMappingURL=integer.test.js.map