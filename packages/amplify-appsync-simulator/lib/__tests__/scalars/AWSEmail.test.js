"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appsync_scalars_1 = require("../../schema/appsync-scalars");
describe('AWSEmail parse', () => {
    it('Should reject a non-string', () => {
        function parse() {
            appsync_scalars_1.scalars.AWSEmail.parseValue(1);
        }
        expect(parse).toThrowErrorMatchingSnapshot();
    });
    it('Should reject an invalid email address', () => {
        function parse() {
            appsync_scalars_1.scalars.AWSEmail.parseValue('@@');
        }
        expect(parse).toThrowErrorMatchingSnapshot();
    });
});
//# sourceMappingURL=AWSEmail.test.js.map