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
describe('$utils.math.round', () => {
    it('should round a double', () => {
        expect(util.math.roundNum(10.2)).toEqual(10);
        expect(util.math.roundNum(10.8)).toEqual(11);
        expect(util.math.roundNum(10)).toEqual(10);
    });
});
describe('$utils.math.minVal', () => {
    it('should get the min value', () => {
        expect(util.math.minVal(13.45, 45.67)).toEqual(13.45);
    });
});
describe('$utils.math.maxVal', () => {
    it('get the max value', () => {
        expect(util.math.maxVal(13.45, 45.67)).toEqual(45.67);
    });
});
describe('$utils.math.random', () => {
    it('get a random value', () => {
        expect(typeof util.math.randomDouble()).toBe('number');
    });
});
describe('$utils.math.randomWithinRange', () => {
    it('get a randomWithinRange value', () => {
        expect(typeof util.math.randomWithinRange(10, 20)).toBe('number');
    });
});
//# sourceMappingURL=math.test.js.map