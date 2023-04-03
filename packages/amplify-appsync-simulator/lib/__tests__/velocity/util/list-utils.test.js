"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockInfo = void 0;
const index_1 = require("../../../velocity/util/index");
const mapper_1 = require("../../../velocity/value-mapper/mapper");
const lodash_1 = require("lodash");
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
describe('$utils.list.copyAndRetainAll', () => {
    it('should retain numbers list', () => {
        const myList = [1, 2, 3, 4, 5];
        expect(util.list.copyAndRetainAll(myList, [2, 4])).toEqual([2, 4]);
    });
    it('should retain java array of java strings', () => {
        const myList = (0, mapper_1.map)(['foo', 'bar', 'baz', 'qux']);
        const result = util.list.copyAndRetainAll(myList, (0, mapper_1.map)(['foo', 'bar']));
        expect(result.toJSON()).toEqual(['foo', 'bar']);
    });
});
describe('$utils.list.copyAndRemoveAll', () => {
    it('should remove numbers', () => {
        const myList = [1, 2, 3, 4, 5];
        expect(util.list.copyAndRemoveAll(myList, [2, 4])).toEqual([1, 3, 5]);
    });
    it('should remove java array of java strings', () => {
        const myList = (0, mapper_1.map)(['foo', 'bar', 'baz', 'qux']);
        const result = util.list.copyAndRemoveAll(myList, (0, mapper_1.map)(['bar', 'qux']));
        expect(result.toJSON()).toEqual(['foo', 'baz']);
    });
});
describe('$utils.list.sortList', () => {
    it('should sort a list of objects asc', () => {
        const myList = [
            { description: 'youngest', age: 5 },
            { description: 'middle', age: 45 },
            { description: 'oldest', age: 85 },
        ];
        expect(util.list.sortList(myList, false, 'description')).toEqual([
            { description: 'middle', age: 45 },
            { description: 'oldest', age: 85 },
            { description: 'youngest', age: 5 },
        ]);
    });
    it('should sort a list of objects desc', () => {
        const myList = [
            { description: 'youngest', age: 5 },
            { description: 'middle', age: 45 },
            { description: 'oldest', age: 85 },
        ];
        expect(util.list.sortList(myList, true, 'description')).toEqual([
            { description: 'youngest', age: 5 },
            { description: 'oldest', age: 85 },
            { description: 'middle', age: 45 },
        ]);
    });
    it('should sort a list of strings asc', () => {
        const myList = ['youngest', 'middle', 'oldest'];
        expect(util.list.sortList(myList, false, 'any')).toEqual(['middle', 'oldest', 'youngest']);
    });
    it('should sort a list of strings desc', () => {
        const myList = ['youngest', 'middle', 'oldest'];
        expect(util.list.sortList(myList, true, 'any')).toEqual(['youngest', 'oldest', 'middle']);
    });
    it('should sort a list of integers asc', () => {
        const myList = [10, 1, 5];
        expect(util.list.sortList(myList, false, 'any')).toEqual([1, 5, 10]);
    });
    it('should sort a list of integers desc', () => {
        const myList = [10, 1, 5];
        expect(util.list.sortList(myList, true, 'any')).toEqual([10, 5, 1]);
    });
    it('should not sort mixed content', () => {
        const myList = [{ name: 'foo' }, 1, 'bar'];
        expect(util.list.sortList(myList, true, 'any')).toEqual(myList);
    });
    it('should not sort list > 1000 elements', () => {
        const myList = (0, lodash_1.map)(Array(1100), () => (0, lodash_1.random)(0, 100));
        expect(util.list.sortList(myList, true, 'any')).toEqual(myList);
    });
});
//# sourceMappingURL=list-utils.test.js.map