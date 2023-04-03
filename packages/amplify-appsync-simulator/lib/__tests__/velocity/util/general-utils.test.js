"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockInfo = void 0;
const index_1 = require("../../../velocity/util/index");
const map_1 = require("../../../velocity/value-mapper/map");
const general_utils_1 = require("../../../velocity/util/general-utils");
const type_definition_1 = require("../../../type-definition");
const stubInfo = {
    fieldName: 'testFieldName',
    path: {
        prev: null,
        key: 'pathKey',
    },
    fieldNodes: [],
    operation: {
        selectionSet: {
            selections: [
                {
                    name: {
                        value: 'someOtherField',
                    },
                },
                {
                    name: {
                        value: 'testFieldName',
                    },
                    selectionSet: {
                        selections: [
                            {
                                name: {
                                    value: 'field1',
                                },
                            },
                            {
                                name: {
                                    value: 'field2',
                                },
                            },
                        ],
                    },
                },
            ],
        },
    },
};
exports.mockInfo = stubInfo;
const stubJavaMap = new map_1.JavaMap({ field1: 'field1Value', field2: 'field2Value', field3: 'field3Value' }, (x) => x);
let util;
beforeEach(() => {
    const executionContext = {
        headers: { 'x-api-key': 'da-fake-key' },
        requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        appsyncErrors: [],
    };
    util = (0, index_1.create)(undefined, undefined, exports.mockInfo, executionContext);
});
it('error_filterDataJavaMap', () => {
    expect(() => util.error('test message', 'ERROR_TYPE', stubJavaMap)).toThrow();
    expect(util.errors.length).toBe(1);
    expect(util.errors[0].data).toStrictEqual({ field1: 'field1Value', field2: 'field2Value' });
});
it('appendError_filterDataJavaMap', () => {
    util.appendError('test message', 'ERROR_TYPE', stubJavaMap);
    expect(util.errors.length).toBe(1);
    expect(util.errors[0].data).toStrictEqual({ field1: 'field1Value', field2: 'field2Value' });
});
describe('$utils.toJson', () => {
    it('should stringify an object', () => {
        const object = { foo: 'Bar' };
        expect(general_utils_1.generalUtils.toJson(object)).toBe('{"foo":"Bar"}');
    });
    it('should return "null" for null values', () => {
        const object = null;
        expect(general_utils_1.generalUtils.toJson(object)).toBe('null');
    });
    it('should return "null" for undefined values', () => {
        const object = undefined;
        expect(general_utils_1.generalUtils.toJson(object)).toBe('null');
    });
    it('should return "true" for true values', () => {
        const object = true;
        expect(general_utils_1.generalUtils.toJson(object)).toBe('true');
    });
    it('should return "false" for false values', () => {
        const object = false;
        expect(general_utils_1.generalUtils.toJson(object)).toBe('false');
    });
});
describe('$util.urlEncode and $util.urlDecode following application/x-www-form-urlencoded specification', () => {
    const reservedChars = "!#$%&'()+,/:;=?@[]";
    const encodedReservedChars = '%21%23%24%25%26%27%28%29%2B%2C%2F%3A%3B%3D%3F%40%5B%5D';
    it('should encode reserved chars from application/x-www-form-urlencoded', () => {
        expect(general_utils_1.generalUtils.urlEncode(reservedChars)).toBe(encodedReservedChars);
    });
    it('should not decode reserved chars from application/x-www-form-urlencoded', () => {
        expect(general_utils_1.generalUtils.urlDecode(encodedReservedChars)).toBe(reservedChars);
    });
});
describe('$util.autoUlid() helper', () => {
    it('should return a ulid matching string', () => {
        const ulidFormat = /[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}/i;
        expect(general_utils_1.generalUtils.autoUlid()).toMatch(ulidFormat);
    });
});
//# sourceMappingURL=general-utils.test.js.map