"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const amplify_cli_core_1 = require("amplify-cli-core");
const containsToRedact = ['key', 'id', 'password', 'name', 'arn', 'address', 'app'];
const quotes = '\\\\?"';
const keyMatcher = `\\w*?(${containsToRedact.join('|')})\\w*?`;
const completeMatch = `${quotes}(${keyMatcher})${quotes}:\\s?${quotes}([^!\\\\?"]+)${quotes}`;
const keyRegEx = new RegExp(keyMatcher, 'gmi');
const jsonRegex = new RegExp(completeMatch, 'gmi');
function testReplaceJsonValues(json, redactedInput) {
    if (!json)
        return json;
    let s = json.toString();
    if (jsonRegex.test(s)) {
        jsonRegex.lastIndex = 0;
        let m;
        const valuesToRedact = [];
        do {
            m = jsonRegex.exec(s);
            if (m != null) {
                valuesToRedact.push(m[3]);
            }
        } while (m !== null);
        valuesToRedact.forEach((val) => {
            s = s.replace(val, redactedInput);
        });
    }
    else {
        return json;
    }
    return s;
}
function redactInput(originalInput, deleteArgAndOption, replacementString = '************') {
    const input = amplify_cli_core_1.JSONUtilities.parse(amplify_cli_core_1.JSONUtilities.stringify(originalInput));
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
            if (!isJson(argv[i]))
                argv[i] = replacementString;
            redactString = false;
            continue;
        }
        if (!isJson(argv[i]) && keyRegEx.test(argv[i])) {
            redactString = true;
            continue;
        }
    }
    if (input.options) {
        Object.keys(input.options).forEach((key) => {
            if (key && input.options && input.options[key] && typeof input.options[key] === 'string') {
                if (keyRegEx.test(key) && !isJson(input.options[key].toString())) {
                    input.options[key] = replacementString;
                }
                else if (typeof input.options[key] === 'string') {
                    input.options[key] = testReplaceJsonValues(input.options[key].toString(), replacementString);
                }
            }
        });
    }
    return input;
}
exports.default = redactInput;
function isJson(s) {
    try {
        amplify_cli_core_1.JSONUtilities.parse(s);
        return true;
    }
    catch (_) {
        return false;
    }
}
//# sourceMappingURL=identifiable-input-regex.js.map