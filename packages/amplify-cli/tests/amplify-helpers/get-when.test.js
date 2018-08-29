const { getWhen } = require('../../src/extensions/amplify-helpers/get-when-function');

describe('get-when helper: ', () => {
  let input = {};
  let answers = {};
  const mockProjectConfig = jest.fn();
  const amplify = {
    getProjectConfig: mockProjectConfig,
  };

  afterEach(() => {
    mockProjectConfig.mockReturnValue({});
  });

  it('...the get-when function should be exported', () => {
    expect(getWhen).toBeDefined();
  });

  describe('case: question without conditions', () => {
    beforeEach(() => {
      input = {
        key: 'testKey',
        question: 'testQuestion',
        required: true,
      };
    });

    it('...should return true when there are no condition arrays', () => {
      const asking = getWhen(input, null, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when there is an empty andCondition array', () => {
      input.andConditions = [];
      const asking = getWhen(input, null, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when there is an empty orCondition array', () => {
      input.orConditions = [];
      const asking = getWhen(input, null, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when there is an empty orCondition array and an empty andCondition array', () => {
      input.orConditions = [];
      input.andConditions = [];
      const asking = getWhen(input, null, null, null)();
      expect(asking).toEqual(true);
    });
  });

  describe('case: question with andConditions', () => {
    beforeEach(() => {
      input = {
        key: 'testKey',
        question: 'testQuestion',
        required: true,
      };
      answers = {
        answer1: 'iamvalue1',
        answer2: 'iamvalue2',
        answer3: ['index1', 'index2'],
      };
    });

    it('...should return true when a single andCondition is met (operator: !=)', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamvaluefake',
          operator: '!=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when a single andCondition is met (operator: =)', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when a single andCondition is met (operator: includes)', () => {
      input.andConditions = [
        {
          key: 'answer3',
          value: 'index1',
          operator: 'includes',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when a single andCondition is met (operator: configMatch)', () => {
      mockProjectConfig.mockReturnValue({
        frontendHandler: {
          ios: 'iamios',
        },
      });
      input.andConditions = [
        {
          key: 'frontendHandler',
          value: 'ios',
          operator: 'configMatch',
        },
      ];
      const asking = getWhen(input, answers, null, amplify)();
      expect(asking).toEqual(true);
    });

    it('...should return false when a single andCondition is not met (operator: !=)', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '!=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });

    it('...should return false when a single andCondition is not met (operator: =)', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamwrongvalue',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });

    it('...should return false when a single andCondition is not met (operator: includes)', () => {
      input.andConditions = [
        {
          key: 'answer3',
          value: 'index3',
          operator: 'includes',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });

    it('...should return false when a single andCondition is not met (operator: configMatch)', () => {
      mockProjectConfig.mockReturnValue({
        frontendHandler: {
          ios: 'iamios',
        },
      });
      input.andConditions = [
        {
          key: 'frontendHandler',
          value: 'android',
          operator: 'configMatch',
        },
      ];
      const asking = getWhen(input, answers, null, amplify)();
      expect(asking).toEqual(false);
    });

    it('...should return true when two andConditions are met', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '=',
        },
        {
          key: 'answer2',
          value: 'iamvalue2',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return false when one andCondition is met and one is not', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '=',
        },
        {
          key: 'answer2',
          value: 'iamtotallywrong',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });

    it('...should return false when two andConditions are not met', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamvaluethewrong',
          operator: '=',
        },
        {
          key: 'answer2',
          value: 'iamtotallywrong',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });
  });

  describe('case: question with orConditions', () => {
    beforeEach(() => {
      input = {
        key: 'testKey',
        question: 'testQuestion',
        required: true,
      };
      answers = {
        answer1: 'iamvalue1',
        answer2: 'iamvalue2',
        answer3: ['index1', 'index2'],
      };
    });

    it('...should return true when a single orCondition is met (operator: !=)', () => {
      input.orConditions = [
        {
          key: 'answer1',
          value: 'iamvaluefake',
          operator: '!=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when a single orConditions is met (operator: =)', () => {
      input.orConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when a single orConditions is met (operator: includes)', () => {
      input.orConditions = [
        {
          key: 'answer3',
          value: 'index1',
          operator: 'includes',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when a single orConditions is met (operator: configMatch)', () => {
      mockProjectConfig.mockReturnValue({
        frontendHandler: {
          ios: 'iamios',
        },
      });
      input.orConditions = [
        {
          key: 'frontendHandler',
          value: 'ios',
          operator: 'configMatch',
        },
      ];
      const asking = getWhen(input, answers, null, amplify)();
      expect(asking).toEqual(true);
    });

    it('...should return false when a single orConditions is not met (operator: !=)', () => {
      input.orConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '!=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });

    it('...should return false when a single orConditions is not met (operator: =)', () => {
      input.orConditions = [
        {
          key: 'answer1',
          value: 'iamwrongvalue',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });

    it('...should return false when a single orConditions is not met (operator: includes)', () => {
      input.orConditions = [
        {
          key: 'answer3',
          value: 'index3',
          operator: 'includes',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });

    it('...should return false when a single orConditions is not met (operator: configMatch)', () => {
      mockProjectConfig.mockReturnValue({
        frontendHandler: {
          ios: 'iamios',
        },
      });
      input.orConditions = [
        {
          key: 'frontendHandler',
          value: 'android',
          operator: 'configMatch',
        },
      ];
      const asking = getWhen(input, answers, null, amplify)();
      expect(asking).toEqual(false);
    });

    it('...should return true when two orConditions are met', () => {
      input.andConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '=',
        },
        {
          key: 'answer2',
          value: 'iamvalue2',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return true when one orCondition is met and one is not', () => {
      input.orConditions = [
        {
          key: 'answer1',
          value: 'iamvalue1',
          operator: '=',
        },
        {
          key: 'answer2',
          value: 'iamtotallywrong',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });

    it('...should return false when two orConditions are not met', () => {
      input.orConditions = [
        {
          key: 'answer1',
          value: 'iamvaluethewrong',
          operator: '=',
        },
        {
          key: 'answer2',
          value: 'iamtotallywrong',
          operator: '=',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(false);
    });
  });

  describe('case: question with andConditions - edit prevention', () => {
    beforeEach(() => {
      input = {
        key: 'testKey',
        question: 'testQuestion',
        required: true,
      };
      answers = {
        answer1: 'iamvalue1',
        answer2: 'iamvalue2',
        answer3: ['index1', 'index2'],
      };
    });

    it('...should return true when a single preventEdit condition is "always")', () => {
      input.andConditions = [
        {
          preventEdit: 'always',
        },
      ];
      const asking = getWhen(input, answers, null, null)();
      expect(asking).toEqual(true);
    });
  });
});
