"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const appsync_scalars_1 = require("../../schema/appsync-scalars");
describe('AWSURL parse', () => {
    it('Returns falsy values unchanged', () => {
        expect(appsync_scalars_1.scalars.AWSURL.parseValue(0)).toEqual(0);
    });
    it('Returns valid URL objects', () => {
        const parsed = new url_1.URL('http://www.amazon.com');
        expect(appsync_scalars_1.scalars.AWSURL.parseValue('http://www.amazon.com')).toEqual(parsed);
    });
    it('Should reject an invalid URL', () => {
        function serialize() {
            appsync_scalars_1.scalars.AWSURL.parseValue('invalid-url');
        }
        expect(serialize).toThrowError('Invalid URL');
    });
});
describe('AWSURL serialize', () => {
    it('Returns falsy values unchanged', () => {
        expect(appsync_scalars_1.scalars.AWSURL.serialize(0)).toEqual(0);
    });
    it('Returns valid URLs', () => {
        expect(appsync_scalars_1.scalars.AWSURL.serialize('http://www.amazon.com')).toEqual('http://www.amazon.com/');
    });
    it('Should reject an invalid URL', () => {
        function serialize() {
            appsync_scalars_1.scalars.AWSURL.serialize('invalid-url');
        }
        expect(serialize).toThrowError('Invalid URL');
    });
});
//# sourceMappingURL=AWSURL.test.js.map