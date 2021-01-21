const containsToRedact = ['key', 'id', 'password', 'name', 'arn', 'address', 'app', 'bucket', 'token'];
const quotes = '\\\\?"';
const keyMatcher = `\\w*?(${containsToRedact.join('|')})\\w*?`;
const completeMatch = `${quotes}(${keyMatcher})${quotes}:\\s?${quotes}([^!\\\\?"]+)${quotes}`;

export function Redactor(arg: string | undefined): string {
  if (!arg) return '';

  // matches any json and gives values in json
  const jsonregex: RegExp = new RegExp(completeMatch, 'gmi');
  // test for value in containsToRedact
  if (jsonregex.test(arg)) {
    jsonregex.lastIndex = 0;
    let m: RegExpExecArray | null;
    const valuestToRedact: Array<string> = [];
    do {
      m = jsonregex.exec(arg);
      if (m !== null) {
        valuestToRedact.push(m[3]);
      }
    } while (m !== null);
    valuestToRedact.forEach(val => {
      //replace value using string Masker
      arg = arg?.replace(val, stringMasker);
    });
  }

  return arg;
}
function stringMasker(s: string): string {
  if (!s.includes('-') && !s.includes('/')) return redactPart(s);

  // if string only includes '/' char
  if (s.includes('/') && !s.includes('-')) return redactBySlashSplit(s);
  const newString = s
    .split('-') // split string by '-'
    .map(part => {
      // and then redact the smaller pieces selarated by '/'
      if (part.includes('/')) {
        // start redacting only when it contains '/'
        return redactBySlashSplit(part);
      } else {
        return redactPart(part);
      }
    })
    .join('-');

  return newString;
}
//redacts all the pieces joined by '/' individually
function redactBySlashSplit(s: string): string {
  return s
    .split('/')
    .map(redactPart)
    .join('/');
}
// replaces 60% of string by [***]
function redactPart(s: string): string {
  const length = s.length;
  const maskPercentage = 60 / 100;
  const replaceLength = Math.floor(length * maskPercentage);
  return '[***]' + s.substring(replaceLength, length);
}
