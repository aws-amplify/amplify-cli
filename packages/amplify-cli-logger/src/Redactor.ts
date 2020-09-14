const containsToRedact = ['key', 'id', 'password', 'name', 'arn', 'address', 'app', 'bucket'];
const quotes = '\\\\?"';
const keyMatcher = `\\w*?(${containsToRedact.join('|')})\\w*?`;
const completeMatch = `${quotes}(${keyMatcher})${quotes}:\\s?${quotes}([^!\\\\?"]+)${quotes}`;

export function Redactor(arg: string | undefined): string {
  if (!arg) return '';

  // matches any json and gives values in json
  const jsonregex: RegExp = new RegExp(completeMatch, 'gmi');
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
      arg = arg?.replace(val, stringMasker);
    });
  }

  return arg;
}
function stringMasker(s: string): string {
  if (!s.includes('-') && !s.includes('/')) return redactPart(s);

  // if string only includes '/' char
  if (s.includes('/') && !s.includes('-')) return redactBySlahsSplit(s);
  const newString = s
    .split('-')
    .map(part => {
      if (part.includes('/')) {
        return redactBySlahsSplit(part);
      } else {
        return redactPart(part);
      }
    })
    .join('-');

  return newString;
}

function redactBySlahsSplit(s: string): string {
  return s
    .split('/')
    .map(redactPart)
    .join('/');
}

function redactPart(s: string): string {
  const length = s.length;
  const maskPercentage = 60 / 100;
  const replaceLength = Math.floor(length * maskPercentage);
  return '[***]' + s.substring(replaceLength, length);
}
