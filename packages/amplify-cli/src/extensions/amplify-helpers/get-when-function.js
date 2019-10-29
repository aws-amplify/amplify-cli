function getWhen(input, answers, previousValues, amplify) {
  // TODO: Promisify

  const conditionParser = () => {
    let andConditions = true;
    let orConditions = true;

    if (input.andConditions && input.andConditions.length > 0) {
      andConditions = input.andConditions.every(condition => findMatch(condition, answers, previousValues, amplify)); // eslint-disable-line max-len
    }

    if (input.orConditions && input.orConditions.length > 0) {
      orConditions = input.orConditions.some(condition => findMatch(condition, answers, previousValues, amplify)); // eslint-disable-line max-len
    }

    return andConditions && orConditions;
  };
  // RETURN THE FUNCTION SO IT CAN BE SET AS THE QUESTION'S "WHEN" VALUE
  return conditionParser;
}

// HELPER FUNCTION TO DETERMINE IF A SINGLE CONDITION IS MET BY ANSWERS
const findMatch = (cond, answers, previousValues, amplify) => {
  let response = true;

  if (!previousValues && cond.onCreate) {
    return false;
  }
  /*eslint-disable*/
  if (!cond.preventEdit) {
    if (cond.operator === '=' && ((answers[cond.key] != undefined && answers[cond.key] !== cond.value) || !answers[cond.key])) {
      response = false;
    } else if (cond.operator === '!=' && (!answers[cond.key] || answers[cond.key] === cond.value)) {
      response = false;
    } else if (cond.operator === 'includes' && (!answers[cond.key] || !answers[cond.key].includes(cond.value))) {
      response = false;
    } else if (cond.operator === 'configMatch' && cond.value && cond.key && amplify) {
      const configKey = amplify.getProjectConfig()[cond.key];
      return configKey.toLowerCase() === cond.value.toLowerCase();
    } else if (cond.operator === 'exists' && previousValues && !previousValues[cond.key]) {
      return false;
    }
  } else if (previousValues && Object.keys(previousValues).length > 0) {
    if (cond.preventEdit === 'always') {
      response = false;
    } else if (cond.preventEdit === 'exists' && !!previousValues[cond.key]) {
      response = false;
    } else if (cond.preventEdit === '=' && previousValues[cond.key] != undefined && previousValues[cond.key] === cond.value) {
      response = false;
    } else if (cond.preventEdit === 'existsInCurrent') {
      if (answers[cond.key]) {
        return false;
      }
    }
  }
  /* eslint-enable */
  return response;
};

module.exports = { getWhen };
