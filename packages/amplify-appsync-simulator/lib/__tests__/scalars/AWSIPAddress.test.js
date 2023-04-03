"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const appsync_scalars_1 = require("../../schema/appsync-scalars");
describe('AWSIPAddress parse', () => {
    it('should parse valid ip address', () => {
        expect(appsync_scalars_1.scalars.AWSIPAddress.parseValue('127.0.0.1')).toEqual('127.0.0.1');
    });
    it('should parse IPV6 address', () => {
        expect(appsync_scalars_1.scalars.AWSIPAddress.parseValue('::ffff:127.0.0.1')).toEqual('::ffff:127.0.0.1');
    });
    it('should throw error when its not a valid ip address', () => {
        expect(() => appsync_scalars_1.scalars.AWSIPAddress.parseValue('not valid ip')).toThrowError('Value is not a valid IP address:');
    });
});
//# sourceMappingURL=AWSIPAddress.test.js.map