"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockInfo = void 0;
const index_1 = require("../../../velocity/util/index");
const type_definition_1 = require("../../../type-definition");
const stubInfo = {};
exports.mockInfo = stubInfo;
var util;
beforeEach(() => {
    const executionContext = {
        headers: { 'x-api-key': 'da-fake-key' },
        requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        appsyncErrors: [],
    };
    util = (0, index_1.create)(undefined, undefined, exports.mockInfo, executionContext);
});
describe('$utils.str.toLower', () => {
    it('should chnage a string to lowercase', () => {
        expect(util.str.toLower('HELLO WORLD')).toEqual('hello world');
        expect(util.str.toLower('hello world')).toEqual('hello world');
        expect(util.str.toLower('HeLlo WorlD')).toEqual('hello world');
    });
});
describe('$utils.str.toUpper', () => {
    it('should chnage a string to uppercase', () => {
        expect(util.str.toUpper('HELLO WORLD')).toEqual('HELLO WORLD');
        expect(util.str.toUpper('hello world')).toEqual('HELLO WORLD');
        expect(util.str.toUpper('HeLlo WorlD')).toEqual('HELLO WORLD');
    });
});
describe('$utils.str.toReplace', () => {
    it('should replace a string', () => {
        expect(util.str.toReplace('hello world, hello!', 'hello', 'mellow')).toEqual('mellow world, mellow!');
    });
});
describe('$utils.str.normalize', () => {
    it('should normalize a string', () => {
        expect(util.str.normalize('\u0041\u006d\u0065\u0301\u006c\u0069\u0065', 'nfc')).toEqual('Amélie');
        expect(util.str.normalize('\u0041\u006d\u0065\u0301\u006c\u0069\u0065', 'nfc')).toEqual('Amélie');
        expect(util.str.normalize('\u00F1', 'nfd')).toEqual('ñ');
        expect(util.str.normalize('\u006E\u0303', 'nfd')).toEqual('ñ');
    });
});
//# sourceMappingURL=str.test.js.map