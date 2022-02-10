import { JavaArray } from './../../../velocity/value-mapper/array';
import { JavaMap } from '../../../velocity/value-mapper/map';
import { JavaString } from '../../../velocity/value-mapper/string';
import { map as mapper } from '../../../velocity/value-mapper/mapper';

describe('JavaMap', () => {
  let identityMapper = jest.fn().mockImplementation(val => val);

  beforeEach(() => {
    identityMapper = jest.fn().mockImplementation(val => val);
  });
  it('New Map', () => {
    const obj = { foo: 1, bar: 2 };
    const map = new JavaMap(obj, identityMapper);
    expect(map.toJSON()).toEqual(obj);
  });

  it('clear', () => {
    const obj = { foo: 1, bar: 2 };
    const map = new JavaMap(obj, identityMapper);
    map.clear();
    expect(map.toJSON()).toEqual({});
  });

  it('containsKey', () => {
    const obj = { foo: 1, bar: 2 };
    const map = new JavaMap(obj, identityMapper);
    expect(map.containsKey('foo')).toBeTruthy();
    expect(map.containsKey('bax')).toBeFalsy();
  });

  it('containsValue', () => {
    const obj = { foo: 'Foo Value', bar: 'Bar Value' };
    const map = new JavaMap(obj, identityMapper);
    expect(map.containsValue('Foo Value')).toBeTruthy();
    expect(map.containsKey('bax value')).toBeFalsy();
  });

  it('entrySet', () => {
    const obj = { foo: 'Foo Value', bar: 'Bar Value' };
    const map = new JavaMap(obj, identityMapper);
    expect(map.entrySet().toJSON()).toEqual([
      { key: 'foo', value: 'Foo Value' },
      { key: 'bar', value: 'Bar Value' },
    ]);
  });

  it('equal', () => {
    const obj = { foo: 'Foo Value', bar: 'Bar Value' };
    const map = new JavaMap(obj, identityMapper);
    const map2 = new JavaMap(obj, identityMapper);
    expect(map.equals(map2)).toBeTruthy();
  });

  it('get', () => {
    const obj = { foo: 'Foo Value', bar: 'Bar Value' };
    const map = new JavaMap(obj, identityMapper);
    expect(map.get('foo')).toEqual('Foo Value');
    expect(map.get('foo1')).toBeNull();
  });

  it('isEmpty', () => {
    const obj = { foo: 'Foo Value', bar: 'Bar Value' };
    const map = new JavaMap(obj, identityMapper);
    expect(map.isEmpty()).toBeFalsy();
    expect(new JavaMap({}, identityMapper).isEmpty()).toBeTruthy();
  });

  it('keySet', () => {
    const obj = { foo: 'Foo Value', bar: 'Bar Value' };
    const map = new JavaMap(obj, identityMapper);
    expect(map.keySet().toJSON()).toEqual(['foo', 'bar']);
  });

  it('keySet returns a JavaArray with each element of type JavaString', () => {
    const obj = { foo: 'Foo Value', bar: 'Bar Value' };
    const map = new JavaMap(obj, mapper);
    expect(map.keySet()).toEqual(new JavaArray([new JavaString('foo'), new JavaString('bar')], mapper));
  });

  it('put', () => {
    const map = new JavaMap({}, identityMapper);
    map.put('foo', 'Foo Value');
    expect(map.toJSON()).toEqual({ foo: 'Foo Value' });
  });

  it('putAll', () => {
    const map = new JavaMap({}, identityMapper);
    map.putAll({ foo: 'Foo Value', bar: 'Bar Value' });
    expect(map.toJSON()).toEqual({ foo: 'Foo Value', bar: 'Bar Value' });
  });
});
