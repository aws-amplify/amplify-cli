export function getWhen(input, answers, previousValues, amplify) {
  // TODO: Promisify

  const conditionParser = () => {
    let andConditions = true;
    let orConditions = true;

    if (input.andConditions && input.andConditions.length > 0) {
      andConditions = input.andConditions.every((condition) => findMatch(condition, answers, previousValues, amplify)); // eslint-disable-line max-len
    }

    if (input.orConditions && input.orConditions.length > 0) {
      orConditions = input.orConditions.some((condition) => findMatch(condition, answers, previousValues, amplify)); // eslint-disable-line max-len
    }

    return andConditions && orConditions;
  };
  // RETURN THE FUNCTION SO IT CAN BE SET AS THE QUESTION'S "WHEN" VALUE
  return conditionParser;
}

// HELPER FUNCTION TO DETERMINE IF A SINGLE CONDITION IS MET BY ANSWERS
const findMatch = (condition, answers, previousValues, amplify) => {
  let response = true;

  if (!previousValues && condition.onCreate) {
    return false;
  }
  /*eslint-disable*/
  if (!condition.preventEdit) {
    if (
      condition.operator === '=' &&
      ((answers[condition.key] != undefined && answers[condition.key] !== condition.value) || !answers[condition.key])
    ) {
      response = false;
    } else if (condition.operator === '!=' && (!answers[condition.key] || answers[condition.key] === condition.value)) {
      response = false;
    } else if (condition.operator === 'includes' && (!answers[condition.key] || !answers[condition.key].includes(condition.value))) {
      response = false;
    } else if (condition.operator === 'configMatch' && condition.value && condition.key && amplify) {
      const configKey = amplify.getProjectConfig()[condition.key];
      return configKey.toLowerCase() === condition.value.toLowerCase();
    } else if (condition.operator === 'exists' && previousValues && !previousValues[condition.key]) {
      return false;
    }
  } else if (previousValues && Object.keys(previousValues).length > 0) {
    if (condition.preventEdit === 'always') {
      response = false;
    } else if (condition.preventEdit === 'exists' && !!previousValues[condition.key]) {
      response = false;
    } else if (
      condition.preventEdit === '=' &&
      previousValues[condition.key] != undefined &&
      previousValues[condition.key] === condition.value
    ) {
      response = false;
    } else if (condition.preventEdit === 'existsInCurrent') {
      if (answers[condition.key]) {
        return false;
      }
    }
  }
  /* eslint-enable */
  return response;
};
