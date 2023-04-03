"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appsync_scalars_1 = require("../../schema/appsync-scalars");
describe('AWSTimestamp parseLiteral', () => {
    it('Returns literals as integers', () => {
        const astNode = { kind: 'IntValue', value: '1234', loc: { start: 68, end: 74 } };
        expect(appsync_scalars_1.scalars.AWSTimestamp.parseLiteral(astNode, null)).toEqual(1234);
    });
    it('Rejects non-integer literals', () => {
        const astNode = { kind: 'StringValue', value: '1234', loc: { start: 68, end: 74 } };
        expect(() => {
            appsync_scalars_1.scalars.AWSTimestamp.parseLiteral(astNode, null);
        }).toThrow('Can only validate integers but received: StringValue');
    });
});
//# sourceMappingURL=AWSTimestamp.test.js.map