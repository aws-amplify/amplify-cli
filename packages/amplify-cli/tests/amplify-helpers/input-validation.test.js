const { inputValidation } = require('../../src/extensions/amplify-helpers/input-validation');

describe('input-validation helper: ', () => {
  let question = {};
  const rejectionString = 'A response is required for this field';

  it('...should be exported', () => {
    expect(inputValidation).toBeDefined();
  });

  it('...should return a function', () => {
    expect(typeof inputValidation()).toEqual('function');
  });

  describe('case: question does not have validation', () => {
    it('...promise should resolve(true) if input is not present and question is not required', async () => {
      await expect(inputValidation(question)(null)).toEqual(true);
    });

    it('...promise should resolve(true) if input is present and question is required', async () => {
      question = { required: true };
      await expect(inputValidation(question)('val')).toEqual(true);
    });

    it('...promise should reject(e) if input is not present but question is required', async () => {
      question = { required: true };
      await expect(inputValidation(question)(null)).toEqual(rejectionString);
    });
  });

  describe('case: validation operator "includes" and input is string', () => {
    beforeEach(() => {
      question.validation = {
        operator: 'includes',
        value: 'test-value',
        onErrorMsg: 'not validated',
      };
    });

    it('...promise should reject if input is empty', async () => {
      await expect(inputValidation(question)('')).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should reject if input does not include value', async () => {
      await expect(inputValidation(question)('my-other-value')).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should resolve(true) if input includes value', async () => {
      await expect(inputValidation(question)('test-value')).toEqual(true);
    });
  });

  describe('case: validation operator "includes" and input is string', () => {
    beforeEach(() => {
      question.validation = {
        operator: 'includes',
        value: 'test-value',
        onErrorMsg: 'not validated',
      };
    });

    it('...promise should reject if input is empty', async () => {
      await expect(inputValidation(question)([])).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should reject if input does not include value', async () => {
      await expect(inputValidation(question)(['other-value'])).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should resolve(true) if input includes value', async () => {
      await expect(inputValidation(question)(['test-value', 'other-value'])).toEqual(true);
    });
  });

  describe('case: validation operator "regex"', () => {
    beforeEach(() => {
      question.validation = {
        operator: 'regex',
        value: '^([a-zA-Z0-9]){1,128}$',
        onErrorMsg: 'not validated',
      };
    });

    it('...promise should reject if input is empty', async () => {
      await expect(inputValidation(question)('')).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should reject if input fails regex test', async () => {
      await expect(inputValidation(question)('@@1')).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should resolve(true) if input passes regex test', async () => {
      await expect(inputValidation(question)('hello1')).toEqual(true);
    });
  });

  describe('case: validation operator "range"', () => {
    beforeEach(() => {
      question.validation = {
        operator: 'range',
        value: { min: 1, max: 10 },
        onErrorMsg: 'not validated',
      };
    });

    it('...promise should reject if input is empty', async () => {
      await expect(inputValidation(question)('')).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should reject if input fails range test', async () => {
      await expect(inputValidation(question)(0)).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should resolve(true) if input passes range test', async () => {
      await expect(inputValidation(question)(5)).toEqual(true);
    });
  });


  describe('case: validation operator "noEmptyArray"', () => {
    beforeEach(() => {
      question.validation = {
        operator: 'noEmptyArray',
        onErrorMsg: 'not validated',
      };
    });

    it('...promise should reject if input is empty', async () => {
      await expect(inputValidation(question)()).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should reject if input is empty', async () => {
      await expect(inputValidation(question)([])).toEqual(question.validation.onErrorMsg);
    });

    it('...promise should resolve(true) if input is populated array', async () => {
      await expect(inputValidation(question)([1, 2])).toEqual(true);
    });
  });

  describe('case: questions is required but gets to end of function without hitting test', () => {
    beforeEach(() => {
      question = {
        validation: {},
        required: true,
      };
    });

    it('...promise should reject(e) if input is not present but question is required', async () => {
      await expect(inputValidation(question)()).toEqual(rejectionString);
    });

    it('...promise should resolve(true) if input equals anything truthy', async () => {
      await expect(inputValidation(question)('val')).toEqual(true);
      await expect(inputValidation(question)(1)).toEqual(true);
      await expect(inputValidation(question)(['index'])).toEqual(true);
    });
  });
});
