import { JavaArray } from './array';
import { JavaInteger } from './integer';
import { toJSON } from './to-json';

export class JavaMap {
  private __map: Map<string, any>;
  // eslint-disable-next-line @typescript-eslint/ban-types
  private __mapper: Function;
  constructor(obj, mapper) {
    this.__mapper = mapper;
    this.__map = new Map();
    Object.entries(obj).forEach(([key, value]) => {
      this.__map.set(key, value);
    });
  }

  clear() {
    this.__map.clear();
  }

  containsKey(key) {
    return this.__map.has(key);
  }

  containsValue(value) {
    return Array.from(this.__map.values()).indexOf(value) !== -1;
  }

  entrySet() {
    const entries = Array.from(this.__map.entries()).map(([key, value]) =>
      createMapProxy(
        new JavaMap(
          {
            key,
            value,
          },
          this.__mapper,
        ),
      ),
    );

    return new JavaArray(entries, this.__mapper);
  }

  equals(value) {
    return Array.from(this.__map.entries()).every(([key, v]) => value.get(key) === v);
  }

  get(key) {
    if (this.__map.has(key.toString())) {
      return this.__map.get(key.toString());
    }
    return null;
  }

  isEmpty() {
    return this.__map.size === 0;
  }

  keySet() {
    return new JavaArray(Array.from(this.__map.keys()).map(this.__mapper as any), this.__mapper);
  }

  put(key, value) {
    const saveValue = this.__mapper(value);
    this.__map.set(key, saveValue);
    return saveValue;
  }

  putAll(map: object | JavaMap) {
    map = toJSON(map);
    Object.entries(map).forEach(([key, value]) => {
      this.put(key, value);
    });
  }

  remove(key) {
    if (!this.__map.has(key)) {
      return null;
    }
    const value = this.__map.get(key);
    this.__map.delete(key);
    return value;
  }

  size() {
    return new JavaInteger(this.__map.size);
  }

  values() {
    return new JavaArray(Array.from(this.__map.values()), this.__mapper);
  }

  toJSON() {
    return Array.from(this.__map.entries()).reduce(
      (sum, [key, value]) => ({
        ...sum,
        [key]: toJSON(value),
      }),
      {},
    );
  }
}

export function createMapProxy(map) {
  return new Proxy(map, {
    get(obj, prop) {
      if (map.__map.has(prop)) {
        return map.get(prop);
      }
      return map[prop];
    },
    set(obj, prop, val) {
      if (typeof val !== 'function') {
        map.__map.set(prop, val);
      }
      return true;
    },
  });
}
