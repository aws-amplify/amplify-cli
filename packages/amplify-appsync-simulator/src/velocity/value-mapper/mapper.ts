import { JavaMap, createMapProxy } from './map';
import { JavaArray } from './array';
import { JavaDecimal } from './decimal';
import { JavaInteger } from './integer';
import { JavaString } from './string';
import { isPlainObject } from 'lodash';

export function map(value: any, hint?: string) {
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

  if (typeof value === 'number') {
    // VTL treats integers differently from floats, but JavaScript number primitives are all doubles.
    // This means we can't really differentiate between 1 and 1.0 in mock. We can rely on hints from the
    // VTL parser though. If a hint was not provided, then we can try to guess using Math.trunc().
    if (hint === 'integer' || (hint !== 'decimal' && Math.trunc(value) === value)) {
      return new JavaInteger(value);
    }

    return new JavaDecimal(value);
  }

  return value;
}
