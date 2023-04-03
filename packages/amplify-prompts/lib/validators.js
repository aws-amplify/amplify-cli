"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.not = exports.or = exports.and = exports.between = exports.exact = exports.minLength = exports.maxLength = exports.integer = exports.matchRegex = exports.alphanumeric = void 0;
const alphanumeric = (message = 'Input must be alphanumeric') => (input) => /^[a-zA-Z0-9]+$/.test(input) ? true : message;
exports.alphanumeric = alphanumeric;
const matchRegex = (validatorRegex, message) => (input) => validatorRegex.test(input) ? true : message || `Input does not match the regular expression ${validatorRegex}`;
exports.matchRegex = matchRegex;
const integer = (message = 'Input must be a number') => (input) => /^[0-9]+$/.test(input) ? true : message;
exports.integer = integer;
const maxLength = (maxLen, message) => (input) => input.length > maxLen ? message || `Input must be less than ${maxLen} characters long` : true;
exports.maxLength = maxLength;
const minLength = (minLen, message) => (input) => input.length < minLen ? message || `Input must be more than ${minLen} characters long` : true;
exports.minLength = minLength;
const exact = (expected, message) => (input) => input === expected ? true : message !== null && message !== void 0 ? message : 'Input does not match expected value';
exports.exact = exact;
const between = (min, max, message) => (input) => parseInt(input) >= min && parseInt(input) <= max ? true : message || `Input must be between ${min} and ${max}`;
exports.between = between;
const and = (validators, message) => async (input) => {
    for (const validator of validators) {
        const result = await validator(input);
        if (typeof result === 'string') {
            return message !== null && message !== void 0 ? message : result;
        }
    }
    return true;
};
exports.and = and;
const or = (validators, message) => async (input) => {
    let result = true;
    for (const validator of validators) {
        result = await validator(input);
        if (result === true) {
            return true;
        }
    }
    return message !== null && message !== void 0 ? message : result;
};
exports.or = or;
const not = (validator, message) => async (input) => typeof (await validator(input)) === 'string' ? true : message;
exports.not = not;
//# sourceMappingURL=validators.js.map