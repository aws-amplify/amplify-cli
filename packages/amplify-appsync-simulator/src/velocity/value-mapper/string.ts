export class JavaString {
  value: string;
  constructor(str) {
    this.value = str;
  }

  replaceAll(find, replace) {
    const rep = this.value.replace(new RegExp(find, 'g'), replace);
    return new JavaString(rep);
  }

  toJSON() {
    return this.toString();
  }

  toString() {
    return this.value;
  }
  toIdString() {
    return this.value;
  }
}
