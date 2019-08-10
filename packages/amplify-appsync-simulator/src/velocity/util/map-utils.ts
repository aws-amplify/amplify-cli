import { JavaMap } from '../value-mapper/map';
import { map as mapper } from '../value-mapper/mapper';
import { JavaArray } from '../value-mapper/array';
export const mapUtils = {
  copyAndRetainAllKeys(map: JavaMap, keys: JavaArray): JavaMap {
    const keyStr = keys.toJSON();
    return mapper(
      map.keySet().toJSON().reduce((sum, [key, val]) => {
        if (keyStr.indexOf(key.toString()) === -1) return sum;
        const valJSON = val && val.toJSON ? val.toJSON() : val;
        return {
          ...sum,
          [key]: valJSON,
        };
      }, {}),
    );
  },
  copyAndRemoveAllKeys(map: JavaMap, keys: JavaArray): JavaMap {
    const keysStr = keys.toJSON();
    const result = map.keySet().toJSON().reduce((acc, key) => {
      key = key && key.toString && key.toString();
      if (!keysStr.includes(key)) {
        const val = map.get(key);
        const valJSON = val && val.toJSON ? val.toJSON() : val;
        return { ...acc, [key]: valJSON };
      }
      return acc;
    }, {});
    return mapper(result);
  },
};
