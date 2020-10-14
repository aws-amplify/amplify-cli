import { create } from '../../../velocity/util/index';
import { JavaMap } from '../../../velocity/value-mapper/map';
import { GraphQLResolveInfo } from 'graphql';
import { TemplateSentError } from '../../../velocity/util/errors';

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
export const mockInfo = stubInfo as GraphQLResolveInfo;
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
