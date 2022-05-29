export class JavaDecimal {
  value: number;

  constructor(val: number) {
    this.value = val;
  }

  valueOf(): number {
    return this.value;
  }

  toJSON(): number {
    return this.value;
  }

  toString(): string {
    return String(this.value);
  }
}
