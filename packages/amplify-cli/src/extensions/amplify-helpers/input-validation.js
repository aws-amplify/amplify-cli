function inputValidation(question) {
  const validator = input => new Promise((resolve, reject) => {
    if (!question.validation) {
      if (question.required) {
        return input ? resolve(true) : reject(new Error('A response is required for this field'));
      }
      resolve(true);
    }
    if (question.validation.operator === 'includes') {
      return input.includes(question.validation.value) ?
        resolve(true) : reject(question.validation.onErrorMsg);
    }
    if (question.validation.operator === 'regex') {
      const regex = new RegExp(question.validation.value);

      return regex.test(input) ?
        resolve(true) : reject(question.validation.onErrorMsg);
    }
    if (question.validation.operator === 'range') {
      const isGood = input >= question.validation.value.min &&
                        input <= question.validation.value.max;
      return isGood ? resolve(true) : reject(question.validation.onErrorMsg);
    }
    if (question.required) {
      return input ? resolve(true) : reject(new Error('A response is required for this field'));
    }
  });
  // RETURN THE FUNCTION SO IT CAN BE SET AS THE QUESTION'S "VALIDATE" VALUE
  return validator;
}

module.exports = { inputValidation };
