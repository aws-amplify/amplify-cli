export function Redactor(arg: string | undefined): string {
  if (!arg) return '';
  arg.replace(/\d{12}/gm, s => 'xxxxxxxx' + s.slice(7, 11));

  const containsToRedact = ['key', 'id', 'password', 'name', 'arn', 'address', 'app', 'bucket'];
  const quotes = '\\\\?"';
  const keyMatcher = `\\w*?(${containsToRedact.join('|')})\\w*?`;
  const completeMatch = `${quotes}(${keyMatcher})${quotes}:\\s?${quotes}([^!\\\\?"]+)${quotes}`;
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
  const length = s.length;
  const maskPercentage = 60 / 100;
  const replaceLength = Math.round(length * maskPercentage);
  return 'x'.repeat(replaceLength) + s.substring(replaceLength, length);
}
