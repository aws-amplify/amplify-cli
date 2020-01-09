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
const hostedUIProviders = [
  {
    name: 'prov1',
    value: 'prov1',
  },
  {
    name: 'prov2',
    value: 'prov2',
  },
  {
    name: 'Loginwithamazon',
    value: 'Loginwithamazon',
  },
];
const attributeProviderMap = {
  email: {
    prov1: {
      attr: 'prov1_email',
      scope: 'default',
    },
    prov2: {
      attr: 'prov2_email',
      scope: 'default',
    },
    loginwithamazon: {
      attr: 'amazon_email',
      scope: 'default',
    },
  },
  address: {
    prov1: {
      attr: 'prov1_address',
      scope: 'default',
    },
    prov2: {},
    loginwithamazon: {
      attr: 'amazon_address',
      scope: 'default',
    },
  },
  locale: {
    prov1: {},
    prov2: {
      attr: 'prov2_locale',
      scope: 'default',
    },
    loginwithamazon: {},
  },
  name: {
    prov1: {},
    prov2: {},
    loginwithamazon: {},
  },
};
const { coreAttributes, updateFlowMap } = maps;
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
    maps.getAllMaps.mockReturnValue({
      mappedOptions1,
      mappedOptions2,
      mappedOptions3,
      hostedUIProviders,
      attributeProviderMap,
      coreAttributes,
      updateFlowMap,
    });
    mockAmplify.getProjectDetails.mockReturnValue('testName');
    delete input.type;
    delete input.map;
    delete input.options;
    delete input.iterator;
    delete input.filter;
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

    // it('should return the choices from the input.options if getWhen is false', () => {
    //   mockAmplify.getWhen.mockReturnValue(() => false);
    //   input.type = 'list';
    //   input.requiredOptions = [{ key: ['required1'] }];
    //   input.options = [{ key: 'testkey', val: 'testval' }];
    //   const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
    //   expect(res.choices).toEqual(input.options);
    // });

    it('should render inputs of type "multiselect" as type "checkbox"', () => {
      input.type = 'multiselect';
      input.when = () => true;
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
    // it('should get mapped option values for list inputs with map values when getWhen is false but requiredOptions are present', () => {
    //   mockAmplify.getWhen.mockReturnValue(() => false);
    //   input.requiredOptions = 'keyone';
    //   input.type = 'list';
    //   input.map = 'mappedOptions1';
    //   const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
    //   expect(res.choices).toEqual(mappedOptions1);
    // });

    // it('should get mapped option values for list inputs with map value when getWhen is false and requiredOptions are missing ', () => {
    //   mockAmplify.getWhen.mockReturnValue(() => false);
    //   input.requiredOptions = [undefined];
    //   input.type = 'list';
    //   input.map = 'mappedOptions1';
    //   const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
    //   expect(res.choices).toEqual(mappedOptions1);
    // });

    it('should add required options to the inputs answers using the filter method', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions1';
      input.requiredOptions = ['mappedOptions2'];
      currentAnswers.mappedOptions2 = 'valueone';
      input.type = 'list';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.filter).toBeTruthy();
    });

    it('should remove required options from the choices presented to the user (currentAnswers variant)', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions3';
      input.requiredOptions = ['mappedOptions2'];
      currentAnswers.mappedOptions2 = 'value2';
      input.type = 'list';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const requiredPresent = res.choices.filter(a => a.name === 'name2').length > 0;
      expect(requiredPresent).toBe(false);
    });

    it('should remove required options from the choices presented to the user (updatingAuth variant)', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions3';
      input.requiredOptions = ['mappedOptions2'];
      Object.assign(mockContext, { updatingAuth: { mappedOptions2: 'value2' } });
      input.type = 'list';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const requiredPresent = res.choices.filter(a => a.name === 'name2').length > 0;
      expect(requiredPresent).toBe(false);
    });

    it('should display as choices for the current question those values entered for the question corresponding to the iterator key', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.iterator = 'iteratorkey';
      Object.assign(mockContext, { updatingAuth: { iteratorkey: ['val1', 'val2'] } });
      input.type = 'list';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const requiredChoices = res.choices && res.choices.length === 2 && res.choices[0].name === 'val1' && res.choices[0].value === 'val1';
      expect(requiredChoices).toBe(true);
    });

    it('should filter list of available providers according to the requiredAttributes of the userpool and whether these attributes are available for the provider in the attribute map', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.filter = 'providers';
      Object.assign(mockContext, { updatingAuth: { requiredAttributes: ['email', 'address'] } });
      input.type = 'multiselect';
      input.map = 'hostedUIProviders';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const correctChoices = res.choices && res.choices.length === 3 && res.choices.filter(i => i.disabled).length === 1;
      expect(correctChoices).toBe(true);
    });

    it('should transform the text in the list of available attributes according to those available for each provider in the attribute map', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      Object.assign(mockContext, { updatingAuth: { requiredAttributes: ['email', 'address'] } });
      input.type = 'multiselect';
      input.filter = 'attributes';
      input.map = 'coreAttributes';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      const emailChoice = res.choices.find(i => i.value === 'email');
      const addressChoice = res.choices.find(i => i.value === 'address');
      const localeChoice = res.choices.find(i => i.value === 'locale');
      const nameChoice = res.choices.find(i => i.value === 'name');
      expect(emailChoice.name).toEqual('Email');
      expect(addressChoice.name).toEqual('Address (This attribute is not supported by Prov2.)');
      expect(localeChoice.name).toEqual('Locale (This attribute is not supported by Prov1, Login With Amazon.)');
      expect(nameChoice.name).toEqual('Name (This attribute is not supported by Prov1, Prov2, Login With Amazon.)');
    });

    it('should disable options based on the update flow (without social options)', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.filter = 'providers';
      input.type = 'multiselect';
      input.filter = 'updateOptions';
      input.map = 'updateFlowMap';
      Object.assign(mockContext, { updatingAuth: {} });
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.choices.length).toEqual(5);
      expect(res.choices[0].value).toEqual('default');
      expect(res.choices[1].value).toEqual('defaultSocial');
      expect(res.choices[2].value).toEqual('manual');
      expect(res.choices[3].value).toEqual('updateUserPoolGroups');
      expect(res.choices[4].value).toEqual('updateAdminQueries');
    });

    it('should disable options based on the update flow (with social options)', () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      Object.assign(mockContext, { updatingAuth: { useDefualt: 'defaultSocial', CallbackURLs: {}, hostedUIProviderCreds: {} } });
      input.filter = 'providers';
      input.type = 'multiselect';
      input.filter = 'updateOptions';
      input.map = 'updateFlowMap';
      const res = coreQuestions.parseInputs(input, mockAmplify, defaultFileName, stringMapFileName, currentAnswers, mockContext);
      expect(res.choices.length).toEqual(7);
      expect(res.choices[0].value).toEqual('default');
      expect(res.choices[1].value).toEqual('defaultSocial');
      expect(res.choices[2].value).toEqual('manual');
      expect(res.choices[3].value).toEqual('callbacks');
      expect(res.choices[4].value).toEqual('providers');
      expect(res.choices[5].value).toEqual('updateUserPoolGroups');
      expect(res.choices[6].value).toEqual('updateAdminQueries');
    });
  });
});
