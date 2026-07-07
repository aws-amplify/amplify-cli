import { create } from '../../../velocity/util/index';
import { map as valueMap } from '../../../velocity/value-mapper/mapper';
import { GraphQLResolveInfo } from 'graphql';
import { map, random } from 'lodash';
import { AppSyncGraphQLExecutionContext } from '../../../utils/graphql-runner';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../../type-definition';

const stubInfo = {} as unknown;
export const mockInfo = stubInfo as GraphQLResolveInfo;
let util;

beforeEach(() => {
  const executionContext: AppSyncGraphQLExecutionContext = {
    headers: { 'x-api-key': 'da-fake-key' },
    requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
    appsyncErrors: [],
  };

  util = create(undefined, undefined, mockInfo, executionContext);
});

describe('$utils.list.copyAndRetainAll', () => {
  it('should retain numbers list', () => {
    const myList = [1, 2, 3, 4, 5];
    expect(util.list.copyAndRetainAll(myList, [2, 4])).toEqual([2, 4]);
  });
  it('should retain java array of java strings', () => {
    const myList = valueMap(['foo', 'bar', 'baz', 'qux']);
    const result = util.list.copyAndRetainAll(myList, valueMap(['foo', 'bar']));
    expect(result.toJSON()).toEqual(['foo', 'bar']);
  });
});

describe('$utils.list.copyAndRemoveAll', () => {
  it('should remove numbers', () => {
    const myList = [1, 2, 3, 4, 5];
    expect(util.list.copyAndRemoveAll(myList, [2, 4])).toEqual([1, 3, 5]);
  });
  it('should remove java array of java strings', () => {
    const myList = valueMap(['foo', 'bar', 'baz', 'qux']);
    const result = util.list.copyAndRemoveAll(myList, valueMap(['bar', 'qux']));
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
    const myList = map(Array(1100), () => random(0, 100));
    expect(util.list.sortList(myList, true, 'any')).toEqual(myList);
  });
});
