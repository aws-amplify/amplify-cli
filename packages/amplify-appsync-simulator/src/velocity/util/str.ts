export const str = {
  toUpper(str: string) {
    return str.toUpperCase();
  },
  toLower(str: string) {
    return str.toLowerCase();
  },
  toReplace(str: string, substr: string, newSubstr: string) {
    return str.replace(new RegExp(substr, 'g'), newSubstr);
  },
  normalize(str: string, form: string) {
    return str.normalize(form.toUpperCase());
  },
};
