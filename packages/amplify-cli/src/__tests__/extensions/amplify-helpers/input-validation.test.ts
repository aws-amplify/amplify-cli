import { inputValidation } from '../../../extensions/amplify-helpers/input-validation';

describe('input-validation', () => {
  it('returns a function to validate user input', () => {
    const validation = inputValidation({
      onErrorMsg: 'error message',
      required: true,
    });
    expect(validation).toBeInstanceOf(Function);
  });

  it('returns a function when question is either of the legacy form', () => {
    const validation = inputValidation({
      validation: {
        onErrorMsg: 'error message',
      },
      required: true,
    });
    expect(validation).toBeInstanceOf(Function);
  });

  describe('case: operator is "include"', () => {
    let validation;

    beforeAll(() => {
      validation = inputValidation({
        operator: 'includes',
        value: '{####}',
        onErrorMsg: "Your message must include '{####}'",
      });
    });

    it('validation returns true when value include in user input', () => {
      expect(validation('code {####}')).toBe(true);
    });

    it('validation returns error message when value include in user input', () => {
      expect(validation('code {###}')).toBe("Your message must include '{####}'");
    });
  });

  describe('case: operator is "regex"', () => {
    let validation;

    beforeAll(() => {
      validation = inputValidation({
        operator: 'regex',
        value: '^[a-zA-Z0-9]+$',
        onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
      });
    });

    it('validation returns true when user input matches specified pattern', () => {
      expect(validation('ValidAPIName')).toBe(true);
    });

    it('validation returns error message when user input not matches specified pattern', () => {
      expect(validation('Invalid-API-Name')).toBe('You can use the following characters: a-z A-Z 0-9');
    });
  });

  describe('case: operator is "range"', () => {
    let validation;

    beforeAll(() => {
      validation = inputValidation({
        operator: 'range',
        value: { min: 10, max: 100 },
        onErrorMsg: 'Your input value length must be greater than 9 and less than 101.',
      });
    });

    it('validation returns true when user input is in specified range', () => {
      expect(validation(10)).toBe(true);
      expect(validation(100)).toBe(true);
    });

    it('validation return error message when user input is not in specified range', () => {
      expect(validation(9)).toBe('Your input value length must be greater than 9 and less than 101.');
      expect(validation(101)).toBe('Your input value length must be greater than 9 and less than 101.');
    });
  });

  describe('case: operator is "noEmptyArray"', () => {
    let validation;

    beforeAll(() => {
      validation = inputValidation({
        operator: 'noEmptyArray',
        onErrorMsg: 'You must select at least one type from the list.',
      });
    });

    it('validation returns true when user input is not empty array', () => {
      expect(validation(['value'])).toBe(true);
    });

    it('validation returns error message when user input is empty array', () => {
      expect(validation([])).toBe('You must select at least one type from the list.');
      expect(validation('value')).toBe('You must select at least one type from the list.');
      expect(validation(1)).toBe('You must select at least one type from the list.');
    });

    it('validation returns error message when user input is not array', () => {
      expect(validation('value')).toBe('You must select at least one type from the list.');
      expect(validation(1)).toBe('You must select at least one type from the list.');
      expect(validation(true)).toBe('You must select at least one type from the list.');
    });
  });

  describe('case: no operator', () => {
    let validation;

    beforeAll(() => {
      validation = inputValidation({
        required: true,
      });
    });

    it('validation returns true when user input is truthy', () => {
      expect(validation('inputValue')).toBe(true);
    });

    it('validation returns message when user input is falsy', () => {
      expect(validation('')).toBe('A response is required for this field');
    });
  });

  describe('case: empty input', () => {
    let validation;

    beforeAll(() => {
      validation = inputValidation({});
    });

    it('validation returns undefined always', () => {
      expect(validation('inputValue')).toBeUndefined();
    });
  });
});
