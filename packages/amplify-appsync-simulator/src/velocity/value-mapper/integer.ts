export class JavaInteger {
  value: number;

  constructor(val: number) {
    this.value = Math.trunc(val);
  }

  valueOf(): number {
    return this.value;
  }

  parseInt(val: any, radix: any = 10): JavaInteger {
    return new JavaInteger(Number.parseInt(val, +radix));
  }

  toJSON(): number {
    return this.value;
  }

  toString(): string {
    return String(this.value);
  }
}
