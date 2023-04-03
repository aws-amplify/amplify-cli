"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringMasker = exports.Redactor = void 0;
const containsToRedact = ['key', 'id', 'password', 'name', 'arn', 'address', 'app', 'bucket', 'token', 'secret'];
const quotes = '\\\\?"';
const keyMatcher = `\\w*?(${containsToRedact.join('|')})\\w*?`;
const completeMatch = `${quotes}(${keyMatcher})${quotes}:\\s?${quotes}([^!\\\\?"]+)${quotes}`;
const Redactor = (arg) => {
    if (!arg)
        return '';
    const jsonRegex = new RegExp(completeMatch, 'gmi');
    if (jsonRegex.test(arg)) {
        jsonRegex.lastIndex = 0;
        let m;
        const valuesToRedact = [];
        do {
            m = jsonRegex.exec(arg);
            if (m !== null) {
                valuesToRedact.push(m[3]);
            }
        } while (m !== null);
        valuesToRedact.forEach((val) => {
            arg = arg === null || arg === void 0 ? void 0 : arg.replace(val, exports.stringMasker);
        });
    }
    return arg;
};
exports.Redactor = Redactor;
const stringMasker = (s) => {
    if (!s.includes('-') && !s.includes('/'))
        return redactPart(s);
    if (s.includes('/') && !s.includes('-'))
        return redactBySlashSplit(s);
    const newString = s
        .split('-')
        .map((part) => {
        if (part.includes('/')) {
            return redactBySlashSplit(part);
        }
        return redactPart(part);
    })
        .join('-');
    return newString;
};
exports.stringMasker = stringMasker;
const redactBySlashSplit = (s) => s.split('/').map(redactPart).join('/');
const redactPart = (s) => {
    const { length } = s;
    const maskPercentage = 60 / 100;
    const replaceLength = Math.floor(length * maskPercentage);
    return `[***]${s.substring(replaceLength, length)}`;
};
//# sourceMappingURL=Redactor.js.map