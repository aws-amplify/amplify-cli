import { JavaArray } from './array';

export class JavaInteger {
  value: number;
  constructor(number) {
    this.value = number;
  }

  parseInt(str) {
    return new JavaInteger(parseInt(str, 10));
  }

  toString() {
    return this.value;
  }
}
