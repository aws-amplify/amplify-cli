import { twoStringSetsAreEqual, twoStringSetsAreDisjoint, findIntersections } from '../../utils/set-ops';

describe('twoStringSetsAreEqual', () => {
  it('return true when provided set strings are the same', () => {
    const a = new Set<string>('test');
    const b = new Set<string>('test');
    const result = twoStringSetsAreEqual(a, b);
    expect(result).toBe(true);
  });

  it('return false when provided set strings are different', () => {
    const a = new Set<string>('test');
    const b = new Set<string>('diff');
    const result: boolean = twoStringSetsAreEqual(a, b);
    expect(result).toBe(false);
  });

  it('return false when provided set strings are different', () => {
    const a = new Set<string>('test');
    const b = new Set<string>('not_test');
    const result: boolean = twoStringSetsAreEqual(a, b);
    expect(result).toBe(false);
  });

  it("return false when provided set strings' length are different", () => {
    const a = new Set<string>('t');
    const b = new Set<string>('test');
    const result: boolean = twoStringSetsAreEqual(a, b);
    expect(result).toBe(false);
  });
});

describe('twoStringSetsAreDisjoint', () => {
  it('return true when provided set strings are different', () => {
    const a = new Set<string>('test');
    const b = new Set<string>('diff');
    const result: boolean = twoStringSetsAreDisjoint(a, b);
    expect(result).toBe(true);
  });

  it('return false when provided set strings have common', () => {
    const a = new Set<string>('not_test');
    const b = new Set<string>('test');
    const result: boolean = twoStringSetsAreDisjoint(a, b);
    expect(result).toBe(false);
  });

  it('return false when provided set strings have common', () => {
    const a = new Set<string>('test');
    const b = new Set<string>('test');
    const result: boolean = twoStringSetsAreDisjoint(a, b);
    expect(result).toBe(false);
  });
});

describe('findIntersections', () => {
  it('return same sets when provided set strings are same', () => {
    const a = new Set<string>('a');
    const b = new Set<string>('a');
    const expected = new Set<string>('a');
    const result = findIntersections(a, b);
    expect(result.toString()).toBe(expected.toString());
  });

  it('return empty set when no common', () => {
    const a = new Set<string>('a');
    const b = new Set<string>('b');
    const expected = new Set<string>();
    const result = findIntersections(a, b);
    expect(result.toString()).toBe(expected.toString());
  });

  it('return common same sets when provided set strings have common', () => {
    const a = new Set<string>('a');
    const b = new Set<string>('ab');
    const expected = new Set<string>('a');
    const result = findIntersections(a, b);
    expect(result.toString()).toBe(expected.toString());
  });

  it('return common same sets when provided set strings have common', () => {
    const a = new Set<string>('ab');
    const b = new Set<string>('b');
    const expected = new Set<string>('a');
    const result = findIntersections(a, b);
    expect(result.toString()).toBe(expected.toString());
  });
});
