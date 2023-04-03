"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const decode_header_1 = require("../../../../../server/subscription/websocket-server/utils/decode-header");
describe('decodeHeaderFromQueryParam', () => {
    it('should decode header query param from the the url', () => {
        const header = {
            authorization: 'some token',
            someOtherValue: 'value',
        };
        const paramName = 'header';
        const base64EncodedHeaderValue = Buffer.from(JSON.stringify(header)).toString('base64');
        const queryParam = new url_1.URLSearchParams({
            [paramName]: base64EncodedHeaderValue,
        });
        const url = `/graphql?${queryParam.toString()}`;
        expect((0, decode_header_1.decodeHeaderFromQueryParam)(url)).toEqual(header);
        expect((0, decode_header_1.decodeHeaderFromQueryParam)(url, paramName)).toEqual(header);
    });
    it('should return an empty object when the parameter is missing in the query', () => {
        const url = `/graphql`;
        const paramName = 'header';
        expect((0, decode_header_1.decodeHeaderFromQueryParam)(url)).toEqual({});
        expect((0, decode_header_1.decodeHeaderFromQueryParam)(url, paramName)).toEqual({});
    });
});
//# sourceMappingURL=decode-headers.test.js.map