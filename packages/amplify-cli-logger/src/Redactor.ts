const containsToRedact = ['key', 'id', 'password', 'name', 'arn', 'address', 'app', 'bucket', 'token', 'secret'];
const quotes = '\\\\?"';
const keyMatcher = `\\w*?(${containsToRedact.join('|')})\\w*?`;
const completeMatch = `${quotes}(${keyMatcher})${quotes}:\\s?${quotes}([^"\\\\]+)${quotes}`;
/**
 * Redacts json string
 * @param arg JSON string to redact
 * @returns redacted json string
 */
export const Redactor = (arg: string | undefined): string => {
  if (!arg) return '';

  // matches any json and gives values in json
  const jsonRegex = new RegExp(completeMatch, 'gmi');
  // test for value in containsToRedact
  if (jsonRegex.test(arg)) {
    jsonRegex.lastIndex = 0;
    let m: RegExpExecArray | null;
    const valuesToRedact: Array<string> = [];
    do {
      m = jsonRegex.exec(arg);
      if (m !== null) {
        valuesToRedact.push(m[3]);
      }
    } while (m !== null);
    valuesToRedact.forEach((val) => {
      // replace value using string Masker
      // eslint-disable-next-line no-param-reassign
      arg = arg?.replace(val, stringMasker);
    });
  }

  return arg;
};

/**
 * Mask string with redaction
 * @param s string to mask
 * @returns replaced string
 */
export const stringMasker = (s: string): string => {
  if (!s.includes('-') && !s.includes('/')) return redactPart(s);

  // if string only includes '/' char
  if (s.includes('/') && !s.includes('-')) return redactBySlashSplit(s);
  const newString = s
    .split('-') // split string by '-'
    .map((part) => {
      // and then redact the smaller pieces separated by '/'
      if (part.includes('/')) {
        // start redacting only when it contains '/'
        return redactBySlashSplit(part);
      }
      return redactPart(part);
    })
    .join('-');

  return newString;
};

// redacts all the pieces joined by '/' individually
const redactBySlashSplit = (s: string): string => s.split('/').map(redactPart).join('/');

// replaces 60% of string by [***]
const redactPart = (s: string): string => {
  const { length } = s;
  const maskPercentage = 60 / 100;
  const replaceLength = Math.floor(length * maskPercentage);
  return `[***]${s.substring(replaceLength, length)}`;
};
