import { create } from '../../../velocity/util/index';
import { GraphQLResolveInfo } from 'graphql';
import { map, random } from 'lodash';

const stubInfo = {} as unknown;
export const mockInfo = stubInfo as GraphQLResolveInfo;
var util;

beforeEach(() => {
  util = create(undefined, undefined, mockInfo);
});

describe('$utils.list.copyAndRetainAll', () => {
  it('should retain', () => {
    const myList = [1, 2, 3, 4, 5];
    expect(util.list.copyAndRetainAll(myList, [2, 4])).toEqual([2, 4]);
  });
});

describe('$utils.list.copyAndRemoveAll', () => {
  it('should remove', () => {
    const myList = [1, 2, 3, 4, 5];
    expect(util.list.copyAndRemoveAll(myList, [2, 4])).toEqual([1, 3, 5]);
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
    const myList = map(Array(1100), () => random(0, 100));
    expect(util.list.sortList(myList, true, 'any')).toEqual(myList);
  });
});
