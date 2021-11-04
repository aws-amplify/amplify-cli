import { JavaMap, createMapProxy } from './map';
import { JavaArray } from './array';
import { JavaString } from './string';
import { isPlainObject } from 'lodash';
import { JavaInteger } from './integer';

export function map(value: any) {
  if (value instanceof JavaMap) return value;
  if (value instanceof JavaArray) return value;
  if (Array.isArray(value)) {
    return new JavaArray(
      value.map(x => map(x)),
      map,
    );
  }
  if (isPlainObject(value)) {
    return createMapProxy(
      new JavaMap(
        Object.entries(value).reduce((sum, [k, v]) => {
          return {
            ...sum,
            [k]: map(v),
          };
        }, {}),
        map,
      ),
    );
  }

  // eslint-disable-next-line
  if (typeof value === 'string' && !((value as any) instanceof JavaString)) {
    // eslint-disable-next-line
    return new JavaString(value);
  }

  if (typeof value === 'number' && !((value as any) instanceof JavaInteger)) {
    return new JavaInteger(value);
  }

  return value;
}
