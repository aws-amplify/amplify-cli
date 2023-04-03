"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWhen = void 0;
function getWhen(input, answers, previousValues, amplify) {
    const conditionParser = () => {
        let andConditions = true;
        let orConditions = true;
        if (input.andConditions && input.andConditions.length > 0) {
            andConditions = input.andConditions.every((condition) => findMatch(condition, answers, previousValues, amplify));
        }
        if (input.orConditions && input.orConditions.length > 0) {
            orConditions = input.orConditions.some((condition) => findMatch(condition, answers, previousValues, amplify));
        }
        return andConditions && orConditions;
    };
    return conditionParser;
}
exports.getWhen = getWhen;
const findMatch = (condition, answers, previousValues, amplify) => {
    let response = true;
    if (!previousValues && condition.onCreate) {
        return false;
    }
    if (!condition.preventEdit) {
        if (condition.operator === '=' &&
            ((answers[condition.key] != undefined && answers[condition.key] !== condition.value) || !answers[condition.key])) {
            response = false;
        }
        else if (condition.operator === '!=' && (!answers[condition.key] || answers[condition.key] === condition.value)) {
            response = false;
        }
        else if (condition.operator === 'includes' && (!answers[condition.key] || !answers[condition.key].includes(condition.value))) {
            response = false;
        }
        else if (condition.operator === 'configMatch' && condition.value && condition.key && amplify) {
            const configKey = amplify.getProjectConfig()[condition.key];
            return configKey.toLowerCase() === condition.value.toLowerCase();
        }
        else if (condition.operator === 'exists' && previousValues && !previousValues[condition.key]) {
            return false;
        }
    }
    else if (previousValues && Object.keys(previousValues).length > 0) {
        if (condition.preventEdit === 'always') {
            response = false;
        }
        else if (condition.preventEdit === 'exists' && !!previousValues[condition.key]) {
            response = false;
        }
        else if (condition.preventEdit === '=' &&
            previousValues[condition.key] != undefined &&
            previousValues[condition.key] === condition.value) {
            response = false;
        }
        else if (condition.preventEdit === 'existsInCurrent') {
            if (answers[condition.key]) {
                return false;
            }
        }
    }
    return response;
};
//# sourceMappingURL=get-when-function.js.map