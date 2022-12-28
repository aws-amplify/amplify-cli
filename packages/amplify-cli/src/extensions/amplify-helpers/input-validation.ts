/**
 * @deprecated Use validators from amplify-prompts or add a new validator to that module
 * question is either of the legacy form:
 * {
 *    validation: {
 *      operator: string
 *      value: string
 *      onErrorMsg: string
 *    },
 *    required: boolean
 * }
 *
 * or the new form:
 * {
 *    operator: string
 *    value: string
 *    onErrorMsg: string
 *    required: boolean
 * }
 *
 * There is some translation logic at the top of the function to translate the legacy parameter into the new form
 */
export function inputValidation(validation) {
  if (Object.prototype.hasOwnProperty.call(validation, 'validation')) {
    Object.assign(validation, { ...validation.validation });
    delete validation.validation;
  }
  return input => {
    if (validation.operator === 'includes') {
      return input.includes(validation.value) ? true : validation.onErrorMsg;
    }
    if (validation.operator === 'regex') {
      const regex = new RegExp(validation.value);
      return regex.test(input) ? true : validation.onErrorMsg;
    }
    if (validation.operator === 'range') {
      const isGood = input >= validation.value.min && input <= validation.value.max;
      return isGood ? true : validation.onErrorMsg;
    }
    if (validation.operator === 'noEmptyArray') {
      return Array.isArray(input) && input.length > 0 ? true : validation.onErrorMsg;
    }

    // no validation rule specified
    if (validation.required) {
      return input ? true : 'A response is required for this field';
    }
    return undefined;
  };
}
