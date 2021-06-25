import md5 from 'md5';
import pluralize from 'pluralize';
export function plurality(val: string, improvePluralization: boolean): string {
  if (!val.trim()) {
    return '';
  }

  if (improvePluralization) {
    return pluralize(val);
  }

  return val.concat('s');
}

export function graphqlName(val: string): string {
  if (!val.trim()) {
    return '';
  }
  const cleaned = val.replace(/^[^_A-Za-z]+|[^_0-9A-Za-z]/g, '');
  return cleaned;
}

export function resourceName(val: string): string {
  const nonAlpaNumericExp: RegExp = /[^a-z0-9+]+/gi;
  if (nonAlpaNumericExp.test(val)) {
    /**
     * Underscores are significant, which means other_name and othername are two different names.
     * https://spec.graphql.org/June2018/#sec-Names
     */
    return `${val.replace(nonAlpaNumericExp, '')}${md5(val).slice(0, 4)}`;
  }
  return val;
}

export function simplifyName(val: string): string {
  if (!val.trim()) {
    return '';
  }
  return toPascalCase(
    val
      .replace(/-?_?\${[^}]*}/g, '')
      .replace(/^[^_A-Za-z]+|[^_0-9A-Za-z]/g, '|')
      .split('|'),
  );
}

export function toUpper(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function toCamelCase(words: string[]): string {
  const formatted = words.map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)));
  return formatted.join('');
}

export function toPascalCase(words: string[]): string {
  const formatted = words.map((w, i) => w.charAt(0).toUpperCase() + w.slice(1));
  return formatted.join('');
}

export const NONE_VALUE = '___xamznone____';
export const NONE_INT_VALUE = -2147483648;
