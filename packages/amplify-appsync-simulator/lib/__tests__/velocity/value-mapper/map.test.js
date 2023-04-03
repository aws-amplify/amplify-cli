"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const array_1 = require("./../../../velocity/value-mapper/array");
const map_1 = require("../../../velocity/value-mapper/map");
const string_1 = require("../../../velocity/value-mapper/string");
const mapper_1 = require("../../../velocity/value-mapper/mapper");
describe('JavaMap', () => {
    let identityMapper = jest.fn().mockImplementation((val) => val);
    beforeEach(() => {
        identityMapper = jest.fn().mockImplementation((val) => val);
    });
    it('New Map', () => {
        const obj = { foo: 1, bar: 2 };
        const map = new map_1.JavaMap(obj, identityMapper);
        expect(map.toJSON()).toEqual(obj);
    });
    it('clear', () => {
        const obj = { foo: 1, bar: 2 };
        const map = new map_1.JavaMap(obj, identityMapper);
        map.clear();
        expect(map.toJSON()).toEqual({});
    });
    it('containsKey', () => {
        const obj = { foo: 1, bar: 2 };
        const map = new map_1.JavaMap(obj, identityMapper);
        expect(map.containsKey('foo')).toBeTruthy();
        expect(map.containsKey('bax')).toBeFalsy();
    });
    it('containsValue', () => {
        const obj = { foo: 'Foo Value', bar: 'Bar Value' };
        const map = new map_1.JavaMap(obj, identityMapper);
        expect(map.containsValue('Foo Value')).toBeTruthy();
        expect(map.containsKey('bax value')).toBeFalsy();
    });
    it('entrySet', () => {
        const obj = { foo: 'Foo Value', bar: 'Bar Value' };
        const map = new map_1.JavaMap(obj, identityMapper);
        expect(map.entrySet().toJSON()).toEqual([
            { key: 'foo', value: 'Foo Value' },
            { key: 'bar', value: 'Bar Value' },
        ]);
    });
    it('equal', () => {
        const obj = { foo: 'Foo Value', bar: 'Bar Value' };
        const map = new map_1.JavaMap(obj, identityMapper);
        const map2 = new map_1.JavaMap(obj, identityMapper);
        expect(map.equals(map2)).toBeTruthy();
    });
    it('get', () => {
        const obj = { foo: 'Foo Value', bar: 'Bar Value' };
        const map = new map_1.JavaMap(obj, identityMapper);
        expect(map.get('foo')).toEqual('Foo Value');
        expect(map.get('foo1')).toBeNull();
    });
    it('isEmpty', () => {
        const obj = { foo: 'Foo Value', bar: 'Bar Value' };
        const map = new map_1.JavaMap(obj, identityMapper);
        expect(map.isEmpty()).toBeFalsy();
        expect(new map_1.JavaMap({}, identityMapper).isEmpty()).toBeTruthy();
    });
    it('keySet', () => {
        const obj = { foo: 'Foo Value', bar: 'Bar Value' };
        const map = new map_1.JavaMap(obj, identityMapper);
        expect(map.keySet().toJSON()).toEqual(['foo', 'bar']);
    });
    it('keySet returns a JavaArray with each element of type JavaString', () => {
        const obj = { foo: 'Foo Value', bar: 'Bar Value' };
        const map = new map_1.JavaMap(obj, mapper_1.map);
        expect(map.keySet()).toEqual(new array_1.JavaArray([new string_1.JavaString('foo'), new string_1.JavaString('bar')], mapper_1.map));
    });
    it('put', () => {
        const map = new map_1.JavaMap({}, identityMapper);
        map.put('foo', 'Foo Value');
        expect(map.toJSON()).toEqual({ foo: 'Foo Value' });
    });
    it('putAll', () => {
        const map = new map_1.JavaMap({}, identityMapper);
        map.putAll({ foo: 'Foo Value', bar: 'Bar Value' });
        expect(map.toJSON()).toEqual({ foo: 'Foo Value', bar: 'Bar Value' });
    });
});
//# sourceMappingURL=map.test.js.map