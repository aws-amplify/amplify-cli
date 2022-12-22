/* eslint-disable max-len */

import { $TSContext, $TSAny } from 'amplify-cli-core';
import { Input, parseInputs } from '../../../../provider-utils/awscloudformation/question-factories/core-questions';
import defaults from '../../../../provider-utils/awscloudformation/assets/cognito-defaults';
import maps from '../../../../provider-utils/awscloudformation/assets/string-maps';

const defaultFileName = 'cognito-defaults';
const stringMapsFileName = 'string-maps';
const mockContext = {} as $TSContext;
let mockAmplify = {
  getWhen: jest.fn(),
  inputValidation: jest.fn(),
  getAllDefaults: jest.fn(),
  getProjectDetails: jest.fn(),
};
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
  {
    name: 'Signinwithapple',
    value: 'Signinwithapple',
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
    signinwithapple: {
      attr: 'apple_email',
      scope: 'default',
    },
  },
  address: {
    prov1: {
      attr: 'prov1_address',
      scope: 'default',
    },
    prov2: {},
    signinwithapple: {},
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
    signinwithapple: {},
  },
  name: {
    prov1: {},
    prov2: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
};
const { coreAttributes, updateFlowMap } = maps;
let currentAnswers: $TSAny = {};

describe('When generating auth questions...', () => {
  beforeEach(() => {
    mockAmplify = {
      getWhen: jest.fn(),
      inputValidation: jest.fn(),
      getAllDefaults: jest.fn(),
      getProjectDetails: jest.fn(),
    };
    defaults.getAllDefaults = jest.fn().mockReturnValue({ Q1: 'default' });
    maps.getAllMaps = jest.fn().mockReturnValue({
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

  const input: Input = {
    key,
    question,
  };

  describe('...and when generating simple inputs...', () => {
    it('should return a question object when passed a simple input without getWhen conditions.', async () => {
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      expect(res).toBeInstanceOf(Object);
    });

    it('should try calling getWhen.', async () => {
      await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      expect(mockAmplify.getWhen).toHaveBeenCalled();
    });

    it('should try calling getAllDefaults if updatingAuth is not present in the context.', async () => {
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      res.default();
      expect(defaults.getAllDefaults).toHaveBeenCalled();
    });

    it('should not getAllDefaults if updatingAuth is present in the context.', async () => {
      mockContext.updatingAuth = { Q1: 'my old answer' };
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      res.default();
      expect(defaults.getAllDefaults).not.toHaveBeenCalled();
    });

    it('should return the answer from context.updatingAuth if updatingAuth is present.', async () => {
      mockContext.updatingAuth = { Q1: 'my old answer' };
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      const def = res.default();
      expect(def).toEqual('my old answer');
    });
  });

  describe('...and when generating complex inputs', () => {
    it('should add required options to the inputs answers using the filter method', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions1';
      input.requiredOptions = ['mappedOptions2'];
      currentAnswers.mappedOptions2 = 'value1';
      input.type = 'list';
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      expect(res.filter).toBeTruthy();
    });

    it('should remove required options from the choices presented to the user (currentAnswers variant)', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions3';
      input.requiredOptions = ['mappedOptions2'];
      currentAnswers.mappedOptions2 = 'value2';
      input.type = 'list';
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      const requiredPresent = res.choices.filter((a: { name: string; }) => a.name === 'name2').length > 0;
      expect(requiredPresent).toBe(false);
    });

    it('should remove required options from the choices presented to the user (updatingAuth variant)', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.map = 'mappedOptions3';
      input.requiredOptions = ['mappedOptions2'];
      Object.assign(mockContext, { updatingAuth: { mappedOptions2: 'value2' } });
      input.type = 'list';
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      const requiredPresent = res.choices.filter((a: { name: string; }) => a.name === 'name2').length > 0;
      expect(requiredPresent).toBe(false);
    });

    it('should display as choices for the current question those values entered for the question corresponding to the iterator key', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.iterator = 'iteratorKey';
      Object.assign(mockContext, { updatingAuth: { iteratorKey: ['val1', 'val2'] } });
      input.type = 'list';
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      const requiredChoices = res.choices && res.choices.length === 2 && res.choices[0].name === 'val1' && res.choices[0].value === 'val1';
      expect(requiredChoices).toBe(true);
    });

    it('should filter list of available providers according to the requiredAttributes of the userpool and whether these attributes are available for the provider in the attribute map', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.filter = 'providers';
      Object.assign(mockContext, { updatingAuth: { requiredAttributes: ['email', 'address'] } });
      input.type = 'multiselect';
      input.map = 'hostedUIProviders';
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      const correctChoices = res.choices && res.choices.length === 4 && res.choices.filter((i: { disabled: any; }) => i.disabled).length === 2;
      expect(correctChoices).toBe(true);
    });

    it('should transform the text in the list of available attributes according to those available for each provider in the attribute map', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      Object.assign(mockContext, { updatingAuth: { requiredAttributes: ['email', 'address'] } });
      input.type = 'multiselect';
      input.filter = 'attributes';
      input.map = 'coreAttributes';
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      const emailChoice = res.choices.find((i: { value: string; }) => i.value === 'email');
      const addressChoice = res.choices.find((i: { value: string; }) => i.value === 'address');
      const localeChoice = res.choices.find((i: { value: string; }) => i.value === 'locale');
      const nameChoice = res.choices.find((i: { value: string; }) => i.value === 'name');
      expect(emailChoice.name).toEqual('Email');
      expect(addressChoice.name).toEqual('Address (This attribute is not supported by Prov2, Sign in with Apple.)');
      expect(localeChoice.name).toEqual('Locale (This attribute is not supported by Prov1, Login With Amazon, Sign in with Apple.)');
      expect(nameChoice.name).toEqual('Name (This attribute is not supported by Prov1, Prov2, Login With Amazon, Sign in with Apple.)');
    });

    it('should disable options based on the update flow (without social options)', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      input.filter = 'providers';
      input.type = 'multiselect';
      input.filter = 'updateOptions';
      input.map = 'updateFlowMap';
      Object.assign(mockContext, { updatingAuth: {} });
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
      expect(res.choices.length).toEqual(5);
      expect(res.choices[0].value).toEqual('default');
      expect(res.choices[1].value).toEqual('defaultSocial');
      expect(res.choices[2].value).toEqual('manual');
      expect(res.choices[3].value).toEqual('updateUserPoolGroups');
      expect(res.choices[4].value).toEqual('updateAdminQueries');
    });

    it('should disable options based on the update flow (with social options)', async () => {
      mockAmplify.getWhen.mockReturnValue(() => true);
      Object.assign(mockContext, { updatingAuth: { useDefualt: 'defaultSocial', CallbackURLs: {}, hostedUIProviderCreds: {} } });
      input.filter = 'providers';
      input.type = 'multiselect';
      input.filter = 'updateOptions';
      input.map = 'updateFlowMap';
      const res = await parseInputs(input, mockAmplify, defaultFileName, stringMapsFileName, currentAnswers, mockContext);
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
