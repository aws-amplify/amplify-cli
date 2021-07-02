import { JavaArray } from './array';

export class JavaString {
  value: string;
  constructor(str) {
    this.value = str;
  }

  concat(str) {
    return new JavaString(this.value.concat(str.toString()));
  }

  contains(str) {
    return this.value.indexOf(str.toString()) !== -1;
  }

  endsWith(suffix) {
    return this.value.endsWith(suffix.toString());
  }

  equals(str) {
    return this.value === str.toString();
  }

  indexOf(val, fromIndex = 0) {
    return this.value.indexOf(val.toString(), fromIndex);
  }

  isEmpty() {
    return this.value.length === 0;
  }

  lastIndexOf(val, fromIndex = Infinity) {
    return this.value.lastIndexOf(val.toString(), fromIndex);
  }

  replace(find, replace) {
    return this.replaceAll(find, replace);
  }

  replaceAll(find, replace) {
    const rep = this.value.replace(new RegExp(find, 'g'), replace);
    return new JavaString(rep);
  }

  replaceFirst(find, replace) {
    const rep = this.value.replace(new RegExp(find), replace);
    return new JavaString(rep);
  }

  matches(regexString) {
    const re = new RegExp(regexString.toString());

    return this.value.match(re) !== null;
  }

  split(regexString, limit = undefined) {
    // WARNING: this assumes Java and JavaScript regular expressions are identical, according to
    // https://en.wikipedia.org/wiki/Comparison_of_regular_expression_engines#Language_features
    // this should be the case except for look-behind which is not implemented in JavaScript

    // java.util.String.split does not to include the separator in the result. JS does splice any capturing group
    // in the regex into the result. To remove the groups from the result we need the count of capturing groups in
    // the provided regex, the only way in JS seems to be via a match to an empty string
    const testRe = new RegExp(`${regexString.toString()}|`);
    const ngroups = ''.match(testRe).length; // actually num of groups plus one, ie "" and the (empty) groups

    const re = new RegExp(regexString.toString());

    const result = this.value.split(re, limit).filter((v, ii) => !(ii % ngroups));
    return new JavaArray(result, e => new JavaString(e.toString()));
  }

  startsWith(prefix, toffset = 0) {
    return this.value.startsWith(prefix.toString(), toffset);
  }

  substring(beginIndex, endIndex = Infinity) {
    return this.value.substring(beginIndex, endIndex);
  }

  toJSON() {
    return this.toString();
  }

  toLowerCase() {
    return new JavaString(this.value.toLowerCase());
  }

  toUpperCase() {
    return new JavaString(this.value.toUpperCase());
  }

  toString() {
    return this.value;
  }

  toIdString() {
    return this.value;
  }

  trim() {
    return new JavaString(this.value.trim());
  }

  length() {
    return this.value && this.value.length;
  }
}
