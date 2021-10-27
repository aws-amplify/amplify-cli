import { create } from '../../../velocity/util/index';
import { JavaMap } from '../../../velocity/value-mapper/map';
import { GraphQLResolveInfo } from 'graphql';
import { hasUncaughtExceptionCaptureCallback } from 'process';
import { generalUtils } from '../../../velocity/util/general-utils';

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

describe('$utils.toJson', () => {
  it('should stringify an object', () => {
    const object = { foo: 'Bar' };
    expect(generalUtils.toJson(object)).toBe('{"foo":"Bar"}');
  });
  it('should return "null" for null values', () => {
    const object = null;
    expect(generalUtils.toJson(object)).toBe('null');
  });

  it('should return "null" for undefined values', () => {
    const object = undefined;
    expect(generalUtils.toJson(object)).toBe('null');
  });

  it('should return "true" for true values', () => {
    const object = true;
    expect(generalUtils.toJson(object)).toBe('true');
  });

  it('should return "false" for false values', () => {
    const object = false;
    expect(generalUtils.toJson(object)).toBe('false');
  });
});

describe('$util.urlEncode and $util.urlDecode following application/x-www-form-urlencoded specification', () => {
  // Appsync does not encode the asterisk
  const reservedChars = "!#$%&'()+,/:;=?@[]";
  const encodedReservedChars = '%21%23%24%25%26%27%28%29%2B%2C%2F%3A%3B%3D%3F%40%5B%5D';
  it('should encode reserved chars from application/x-www-form-urlencoded', () => {
    expect(generalUtils.urlEncode(reservedChars)).toBe(encodedReservedChars);
  });

  it('should not decode reserved chars from application/x-www-form-urlencoded', () => {
    expect(generalUtils.urlDecode(encodedReservedChars)).toBe(reservedChars);
  });
});
