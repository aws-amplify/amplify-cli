import { JavaInteger } from './integer';
import { toJSON } from './to-json';

export class JavaArray extends Array<any> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  private mapper: Function;
  // eslint-disable-next-line @typescript-eslint/ban-types
  constructor(values = [], mapper: Function) {
    if (!Array.isArray(values)) {
      // splice sends a single object
      values = [values];
    }
    if (values.length !== 1) {
      super(...values);
    } else {
      super();
      this.push(values[0]);
    }
    Object.setPrototypeOf(this, Object.create(JavaArray.prototype));
    this.mapper = mapper;
  }

  add(value) {
    this.push(this.mapper(value));
    return value;
  }

  addAll(value) {
    value.forEach(val => this.push(this.mapper(val)));
  }

  clear() {
    this.length = 0;
  }

  contains(value) {
    value = value && value.toJSON ? value.toJSON() : value;
    return this.toJSON().indexOf(value) !== -1;
  }

  containsAll(value = []) {
    return value.every(v => this.contains(v));
  }

  isEmpty() {
    return this.length === 0;
  }

  remove(value) {
    const idx = this.indexOf(value);
    if (idx === -1) return;
    this.splice(idx, 1);
  }

  removeAll(value) {
    value.forEach(val => this.remove(val));
  }

  retainAll() {
    throw new Error('no support for retain all');
  }

  size() {
    return new JavaInteger(this.length);
  }

  toJSON() {
    return Array.from(this).map(toJSON);
  }

  indexOf(obj) {
    const value = obj?.toJSON ? obj.toJSON() : obj;
    for (let i = 0; i < this.length; i++) {
      const item = this[i]?.toJson ? this[i]?.toJson() : this[i];
      if (item === value) {
        return i;
      }
    }
    return -1;
  }
}
