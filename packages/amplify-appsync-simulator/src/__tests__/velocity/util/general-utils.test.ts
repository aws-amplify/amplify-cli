import { GraphQLResolveInfo } from 'graphql';
import { create } from '../../../velocity/util/index';
import { JavaMap } from '../../../velocity/value-mapper/map';

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
} as unknown;
const mockInfo = stubInfo as GraphQLResolveInfo;
const stubJavaMap: JavaMap = new JavaMap({ field1: 'field1Value', field2: 'field2Value', field3: 'field3Value' }, x => x);
var util;

beforeEach(() => {
  util = create(undefined, undefined, mockInfo);
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

test('util.isNullOrEmpty should return false for truthy values', () => {
  expect(util.isNullOrEmpty(true)).toBe(false);
  expect(util.isNullOrEmpty('not empty')).toBe(false);
});

test('util.isNullOrEmpty should return true for false, empty or null values', () => {
  expect(util.isNullOrEmpty(false)).toBe(true);
  expect(util.isNullOrEmpty('')).toBe(true);
  expect(util.isNullOrEmpty(null)).toBe(true);
  expect(util.isNullOrEmpty(undefined)).toBe(true);
});
