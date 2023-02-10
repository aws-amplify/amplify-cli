import { JSONUtilities } from 'amplify-cli-core';
import { CommandLineInput } from 'amplify-cli-core';

const containsToRedact = ['key', 'id', 'password', 'name', 'arn', 'address', 'app'];
const quotes = '\\\\?"';
const keyMatcher = `\\w*?(${containsToRedact.join('|')})\\w*?`;
const completeMatch = `${quotes}(${keyMatcher})${quotes}:\\s?${quotes}([^!\\\\?"]+)${quotes}`;
//matches any string with containsToRedact in it
const keyRegEx = new RegExp(keyMatcher, 'gmi');
// matches any json and gives values in json
const jsonRegex = new RegExp(completeMatch, 'gmi');
function testReplaceJsonValues(json: string, redactedInput: string): string {
  if (!json) return json;
  let s: string = json.toString();
  if (jsonRegex.test(s)) {
    jsonRegex.lastIndex = 0;
    let m: RegExpExecArray | null;
    const valuesToRedact: any = [];

    //find all values to redact
    do {
      m = jsonRegex.exec(s);
      if (m != null) {
        valuesToRedact.push(m[3]);
      }
    } while (m !== null);

    //replace them
    valuesToRedact.forEach(val => {
      s = s.replace(val, redactedInput);
    });
  } else {
    return json;
  }
  return s;
}

export default function redactInput(
  originalInput: CommandLineInput,
  deleteArgAndOption: boolean,
  replacementString = '************',
): CommandLineInput {
  const input: CommandLineInput = JSONUtilities.parse(JSONUtilities.stringify(originalInput)!);
  const argv = input.argv;
  const length = argv.length;
  let redactString = false;
  if (deleteArgAndOption) {
    input.argv = [];
    delete input.options;
    return input;
  }
  for (let i = 0; i < length; i++) {
    argv[i] = testReplaceJsonValues(argv[i], replacementString);
    if (redactString) {
      if (!isJson(argv[i])) argv[i] = replacementString;
      redactString = false;
      continue;
    }
    if (!isJson(argv[i]) && keyRegEx.test(argv[i])) {
      redactString = true;
      continue;
    }
  }
  if (input.options) {
    Object.keys(input.options).forEach(key => {
      if (key && input.options && input.options[key] && typeof input.options[key] === 'string') {
        if (keyRegEx.test(key) && !isJson(input.options[key].toString())) {
          input.options[key] = replacementString;
        } else if (typeof input.options[key] === 'string') {
          input.options[key] = testReplaceJsonValues(input.options[key].toString(), replacementString);
        }
      }
    });
  }

  return input;
}

function isJson(s: string): boolean {
  try {
    JSONUtilities.parse(s);
    return true;
  } catch (_) {
    return false;
  }
}
