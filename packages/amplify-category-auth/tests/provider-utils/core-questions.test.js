/* eslint-disable max-len */

const coreQuestions = require('../../provider-utils/awscloudformation/question-factories/core-questions');
const defaults = require('../../provider-utils/awscloudformation/assets/cognito-defaults');
const maps = require('../../provider-utils/awscloudformation/assets/string-maps');


const defaultFileName = 'cognito-defaults';
const stringMapFileName = 'string-maps';
const mockContext = {};
let mockAmplify = {};
const mappedOptions1 = [{ name: 'name1', value: 'value1' }];
const mappedOptions2 = [{ name: 'name1', value: 'value1' }];
const mappedOptions3 = [
  { name: 'name1', value: 'value1' },
  { name: 'name2', value: 'value2' },
];
let currentAnswers = {};

describe('When generating auth questions...', () => {
  beforeEach(() => {
    mockAmplify = {
      getWhen: jest.fn(),
      inputValidation: jest.fn(),
      getAllDefaults: jest.fn(),
      getProjectDetails: jest.fn(),
    };
    defaults.getAllDefaults = jest.fn();
    defaults.getAllDefaults.mockReturnValue({ Q1: 'default' });
    maps.getAllMaps = jest.fn();
    maps.getAllMaps.mockReturnValue({ mappedOptions1, mappedOptions2, mappedOptions3 });
    mockAmplify.getProjectDetails.mockReturnValue('testName');
    delete input.type;
    delete input.map;
    delete input.options;
  });
  afterEach(() => {
    delete mockContext.updatingAuth;
    currentAnswers = {};
  });


  const key = 'Q1';
  const question = 'What is your name?';

  const input = {
    key,
    question,
  };

  describe('...and when generating simple inputs...', () => {
    it('it should return a question object when passed a simple input without getWhen conditions.', () => {
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res).toBeInstanceOf(Object);
      expect(res.type).toEqual('input');
      expect(res.name).toEqual(key);
      expect(res.message).toEqual(question);
    });

    it('should try calling getWhen.', () => {
      coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(mockAmplify.getWhen).toHaveBeenCalled();
    });

    it('should try calling inputValidation.', () => {
      coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(mockAmplify.inputValidation).toHaveBeenCalled();
    });

    it('should try calling getAllDefaults if updatingAuth is not present in the context.', () => {
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      res.default();
      expect(defaults.getAllDefaults).toHaveBeenCalled();
    });

    it('should not getAllDefaults if updatingAuth is present in the context.', () => {
      mockContext.updatingAuth = { Q1: 'my old answer' };
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      res.default();
      expect(defaults.getAllDefaults).not.toHaveBeenCalled();
    });

    it('should return the answer from context.updatingAuth if updatingAuth is present.', () => {
      mockContext.updatingAuth = { Q1: 'my old answer' };
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const def = res.default();
      expect(def).toEqual('my old answer');
    });

    it('should return the choices from the input.options if getWhen is false', () => {
      mockAmplify.getWhen.mockReturnValue(() => false);
      input.type = 'list';
      input.requiredOptions = [{ key: 'required1' }];
      input.options = [{ key: 'testkey', val: 'testval' }];
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.choices).toEqual(input.options);
    });

    it('should return the choices from the input.options if getWhen is false', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.type = 'list';
      input.requiredOptions = null;
      input.options = [{ key: 'testkey', val: 'testval' }];
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.choices).toEqual(input.options);
    });

    it('should render inputs of type "multiselect" as type "checkbox"', () => {
      input.type = 'multiselect';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.type).toEqual('checkbox');
    });

    it('should render inputs of type "confirm" as type "confirm"', () => {
      input.type = 'confirm';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.type).toEqual('confirm');
    });

    it('should render inputs of type "input" as type "input"', () => {
      input.type = 'input';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.type).toEqual('input');
    });

    it('should render inputs without a type as type "input"', () => {
      input.type = undefined;
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.type).toEqual('input');
    });
  });

  describe('...and when generating complex inputs', () => {
    it('should get mapped option values for list inputs with map values when getWhen is false but requiredOptions are present', () => {
      mockAmplify.getWhen.mockReturnValue(() => false);
      input.requiredOptions = 'keyone';
      input.type = 'list';
      input.map = 'mappedOptions1';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.choices).toEqual(mappedOptions1);
    });

    it('should get mapped option values for list inputs with map values when getWhen is true but requiredOptions are missing ', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.requiredOptions = undefined;
      input.type = 'list';
      input.map = 'mappedOptions1';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.choices).toEqual(mappedOptions1);
    });

    it('should get mapped option values for list inputs with map value when getWhen is false and requiredOptions are missing ', () => {
      mockAmplify.getWhen.mockReturnValue(() => false);
      input.requiredOptions = undefined;
      input.type = 'list';
      input.map = 'mappedOptions1';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.choices).toEqual(mappedOptions1);
    });

    it('should add required options to the inputs answers using the filter method', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions1';
      input.requiredOptions = 'mappedOptions2';
      currentAnswers.mappedOptions2 = 'valueone';
      input.type = 'list';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.filter).toBeTruthy();
    });

    it('should remove required options from the choices presented to the user (currentAnswers variant)', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions3';
      input.requiredOptions = 'mappedOptions2';
      currentAnswers.mappedOptions2 = 'value2';
      input.type = 'list';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const requiredPresent = res.choices.filter(a => a.name === 'name2').length > 0;
      expect(requiredPresent).toBe(false);
    });

    it('should remove required options from the choices presented to the user (updatingAuth variant)', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions3';
      input.requiredOptions = 'mappedOptions2';
      Object.assign(mockContext, { updatingAuth: { mappedOptions2: 'value2' } });
      input.type = 'list';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const requiredPresent = res.choices.filter(a => a.name === 'name2').length > 0;
      expect(requiredPresent).toBe(false);
    });
  });
});
