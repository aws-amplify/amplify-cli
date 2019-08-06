import { JavaArray } from '../../../velocity/value-mapper/array';

const identityMapper = jest.fn(v => v);

describe(' Velocity ValueMapper JavaArray', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('Should initialize from JS Array', () => {
    const JS_ARRAY = [1, 2, 3];
    const arr = new JavaArray(JS_ARRAY, identityMapper);
    expect(arr.toJSON()).toEqual(JS_ARRAY);
  });

  it('size', () => {
    const JS_ARRAY = [1, 2, 3];
    const arr = new JavaArray(JS_ARRAY, identityMapper);
    expect(arr.size()).toEqual(JS_ARRAY.length);
  });

  it('isEmpty', () => {
    expect(new JavaArray([1, 2, 3], identityMapper).isEmpty()).toBeFalsy();
    expect(new JavaArray([], identityMapper).isEmpty()).toBeTruthy();
  });

  it('add', () => {
    const arr = new JavaArray([], identityMapper);
    arr.add(1);
    expect(arr.size()).toEqual(1);
    expect(arr.toJSON()).toEqual([1]);
  });

  it('addAll', () => {
    const NEW_ARR = [1, 2, 3];
    const arr = new JavaArray([], identityMapper);
    arr.addAll(NEW_ARR);
    expect(identityMapper).toBeCalledTimes(NEW_ARR.length);
    expect(arr.size()).toEqual(NEW_ARR.length);
    expect(arr.toJSON()).toEqual(NEW_ARR);
  });

  it('clear', () => {
    const NEW_ARR = [1, 2, 3];
    const arr = new JavaArray(NEW_ARR, identityMapper);
    expect(arr.size()).toEqual(NEW_ARR.length);
    arr.clear();
    expect(arr.toJSON()).toEqual([]);
  });

  it('contains', () => {
    const NEW_ARR = [1, 2, 3];
    const arr = new JavaArray(NEW_ARR, identityMapper);
    expect(arr.contains(1)).toBeTruthy();
    expect(arr.contains('Z')).toBeFalsy();
  });

  it('containsAll', () => {
    const NEW_ARR = [1, 2, 3];
    const arr = new JavaArray(NEW_ARR, identityMapper);
    expect(arr.containsAll(NEW_ARR)).toBeTruthy();
    expect(arr.containsAll([2])).toBeTruthy();
    expect(arr.containsAll([...NEW_ARR, 'Z'])).toBeFalsy();
  });

  it('remove', () => {
    const NEW_ARR = [1, 2, 3];
    const arr = new JavaArray(NEW_ARR, identityMapper);
    arr.remove(3);
    expect(arr.toJSON()).toEqual([1, 2]);
  });

  it('removeAll', () => {
    const NEW_ARR = [1, 2, 3];
    const arr = new JavaArray(NEW_ARR, identityMapper);
    arr.removeAll([3, 2]);
    expect(arr.toJSON()).toEqual([1]);
  });

  // it('retainAll', () => {
  //   const NEW_ARR = [1, 2, 3, 4];
  //   const arr = new JavaArray(NEW_ARR, identityMapper);
  //   arr.retainAll([3, 2, 20]);
  //   expect(arr.toJSON()).toEqual([2, 3]);
  // })
});
