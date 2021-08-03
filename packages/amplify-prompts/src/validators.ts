export type Validator = (value: string) => true | string | Promise<true | string>;

/*
  In the functions below, "message" should be a declarative phrase describing the allowed input.
  It should describe what the input CAN be, not what it CANNOT be.
  Validators can be combined using and(), or() and not() utility functions.

  For example:
  and([alphanumeric(), minLength(10)]) will allow alphanumeric inputs with length >= 10

  Over time, we can build up a library of common validators here to reuse across the codebase.
  Each function here should be a factory function that takes in some parameters and returns a Validator
*/

export const alphanumeric = (message: string = 'Input must be alphanumeric'): Validator => (input: string) =>
  /^[a-zA-Z0-9]+$/.test(input) ? true : message;

export const integer = (message: string = 'Input must be a number'): Validator => (input: string) =>
  /^[0-9]+$/.test(input) ? true : message;

export const maxLength = (maxLen: number, message?: string): Validator => (input: string) =>
  input.length > maxLen ? message || `Input must be less than ${maxLen} characters long` : true;

export const minLength = (minLen: number, message?: string): Validator => (input: string) =>
  input.length < minLen ? message || `Input must be more than ${minLen} characters long` : true;

/**
 * Logically "and"s several validators
 * If a validator returns an error message, that message is returned by this function, unless an override message is specified
 */
export const and = (validators: [Validator, Validator, ...Validator[]], message?: string): Validator => async (input: string) => {
  for (const validator of validators) {
    const result = await validator(input);
    if (typeof result === 'string') {
      return message ?? result;
    }
  }
  return true;
};

/**
 * Logically "or" several validators
 * If all validators return an error message, the LAST error message is returned by this function, unless an override message is specified
 */
export const or = (validators: [Validator, Validator, ...Validator[]], message?: string): Validator => async (input: string) => {
  let result: string | true = true;
  for (const validator of validators) {
    result = await validator(input);
    if (result === true) {
      return true;
    }
  }
  return message ?? result;
};

/**
 * Logical not operator on a validator
 * If validator returns true, it returns message. If validator returns an error message, it returns true.
 */
export const not = (validator: Validator, message: string): Validator => async (input: string) =>
  typeof (await validator(input)) === 'string' ? true : message;
