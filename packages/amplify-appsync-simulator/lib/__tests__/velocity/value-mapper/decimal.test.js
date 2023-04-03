"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decimal_1 = require("../../../velocity/value-mapper/decimal");
describe('JavaDecimal', () => {
    it('valueOf()', () => {
        const val1 = new decimal_1.JavaDecimal(5);
        const val2 = new decimal_1.JavaDecimal(3.14159);
        expect(val1 + val2).toEqual(8.14159);
    });
    it('toJSON()', () => {
        const val = new decimal_1.JavaDecimal(4.2);
        expect(val.toJSON()).toEqual(4.2);
        expect(JSON.stringify(val)).toEqual('4.2');
    });
    it('toString()', () => {
        const val = new decimal_1.JavaDecimal(-10.3);
        expect(val.toString()).toEqual('-10.3');
        expect(val + '').toEqual('-10.3');
    });
});
//# sourceMappingURL=decimal.test.js.map