"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const array_1 = require("../../../velocity/value-mapper/array");
const string_1 = require("../../../velocity/value-mapper/string");
const identityMapper = jest.fn((v) => v);
describe(' Velocity ValueMapper JavaArray', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('Should initialize from JS Array', () => {
        const JS_ARRAY = [1, 2, 3];
        const arr = new array_1.JavaArray(JS_ARRAY, identityMapper);
        expect(arr.toJSON()).toEqual(JS_ARRAY);
    });
    it('size', () => {
        const JS_ARRAY = [1, 2, 3];
        const arr = new array_1.JavaArray(JS_ARRAY, identityMapper);
        expect(arr.size().valueOf()).toEqual(JS_ARRAY.length);
    });
    it('isEmpty', () => {
        expect(new array_1.JavaArray([1, 2, 3], identityMapper).isEmpty()).toBeFalsy();
        expect(new array_1.JavaArray([], identityMapper).isEmpty()).toBeTruthy();
    });
    it('add', () => {
        const arr = new array_1.JavaArray([], identityMapper);
        arr.add(1);
        expect(arr.size().valueOf()).toEqual(1);
        expect(arr.toJSON()).toEqual([1]);
    });
    it('addAll', () => {
        const NEW_ARR = [1, 2, 3];
        const arr = new array_1.JavaArray([], identityMapper);
        arr.addAll(NEW_ARR);
        expect(identityMapper).toBeCalledTimes(NEW_ARR.length);
        expect(arr.size().valueOf()).toEqual(NEW_ARR.length);
        expect(arr.toJSON()).toEqual(NEW_ARR);
    });
    it('clear', () => {
        const NEW_ARR = [1, 2, 3];
        const arr = new array_1.JavaArray(NEW_ARR, identityMapper);
        expect(arr.size().valueOf()).toEqual(NEW_ARR.length);
        arr.clear();
        expect(arr.toJSON()).toEqual([]);
    });
    it('contains', () => {
        const NEW_ARR = [1, 2, 3];
        const arr = new array_1.JavaArray(NEW_ARR, identityMapper);
        expect(arr.contains(1)).toBeTruthy();
        expect(arr.contains('Z')).toBeFalsy();
    });
    it('containsAll', () => {
        const NEW_ARR = [1, 2, 3];
        const arr = new array_1.JavaArray(NEW_ARR, identityMapper);
        expect(arr.containsAll(NEW_ARR)).toBeTruthy();
        expect(arr.containsAll([2])).toBeTruthy();
        expect(arr.containsAll([...NEW_ARR, 'Z'])).toBeFalsy();
    });
    it('remove', () => {
        const NEW_ARR = [1, 2, 3];
        const arr = new array_1.JavaArray(NEW_ARR, identityMapper);
        arr.remove(3);
        expect(arr.toJSON()).toEqual([1, 2]);
    });
    it('removeAll', () => {
        const NEW_ARR = [1, 2, 3];
        const arr = new array_1.JavaArray(NEW_ARR, identityMapper);
        arr.removeAll([3, 2]);
        expect(arr.toJSON()).toEqual([1]);
    });
    it('indexOf', () => {
        const obj = { prop: 1 };
        const NEW_ARR = [1, 2, 3, 'someStr', true, obj];
        const arr = new array_1.JavaArray(NEW_ARR, identityMapper);
        expect(arr.indexOf(3)).toEqual(2);
        expect(arr.indexOf(122)).toEqual(-1);
        expect(arr.indexOf('someStr')).toEqual(3);
        expect(arr.indexOf(new string_1.JavaString('someStr'))).toEqual(3);
        expect(arr.indexOf(true)).toEqual(4);
        expect(arr.indexOf(obj)).toEqual(5);
        expect(arr.indexOf({ prop: 1 })).toEqual(-1);
    });
});
//# sourceMappingURL=array.test.js.map