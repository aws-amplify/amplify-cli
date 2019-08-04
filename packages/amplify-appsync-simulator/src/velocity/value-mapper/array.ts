import { toJSON } from './to-json';

export class JavaArray extends Array<any> {
  private mapper: Function;
  constructor(values = [], mapper: Function) {
    if(!Array.isArray(values)) { // splice sends a single object
      values = [values];
    }
    super(...values);
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
    const self = this;
    value.forEach(val => self.remove(val));
  }

  retainAll() {
    throw new Error('no support for retain all');
  }

  size() {
    return this.length;
  }

  toJSON() {
    return Array.from(this).map(toJSON);
  }
}
