import { GraphQLAPIProvider, TransformerResourceHelperProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { CfnParameter } from '@aws-cdk/core';
import { TransformerResourceHelper } from '../../transformer-context/resource-helper';
import { StackManager } from '../../transformer-context/stack-manager';

const testEnv = 'testenv';
const testApiId = 'testtest123';

let resourceHelper: TransformerResourceHelperProvider;

beforeEach(() => {
  resourceHelper = getResourceHelper();
});

describe('generateTableName', () => {
  it('throws if api not initialized', () => {
    resourceHelper = getResourceHelper(false);
    expect(() => resourceHelper.generateTableName('Test')).toThrowErrorMatchingInlineSnapshot(`"API not initialized"`);
  });

  it('uses model name if no rename specified', () => {
    expect(resourceHelper.generateTableName('Test')).toEqual(`Test-${testApiId}-${testEnv}`);
  });

  it('uses model rename if specified', () => {
    resourceHelper.setModelNameMapping('TestRename', 'Test');
    expect(resourceHelper.generateTableName('TestRename')).toEqual(`Test-${testApiId}-${testEnv}`);
  });
});

describe('getModelNameMapping', () => {
  it('returns given model name if no mapping found', () => {
    expect(resourceHelper.getModelNameMapping('Test')).toEqual('Test');
  });

  it('returns mapped name if found', () => {
    resourceHelper.setModelNameMapping('TestRename', 'Test');
    expect(resourceHelper.getModelNameMapping('TestRename')).toEqual('Test');
  });
});

describe('isModelRenamed', () => {
  it('returns true if mapping is different from original name', () => {
    resourceHelper.setModelNameMapping('TestRename', 'Test');
    expect(resourceHelper.isModelRenamed('TestRename')).toBe(true);
  });

  it('returns false if no mapping exists', () => {
    expect(resourceHelper.isModelRenamed('Test')).toBe(false);
  });

  it('returns false if mapping is same as name', () => {
    resourceHelper.setModelNameMapping('Test', 'Test');
    expect(resourceHelper.isModelRenamed('Test')).toBe(false);
  });
});

describe('getModelFieldMap', () => {
  it('makes new modelFieldMap if not already present', () => {
    const testFieldMap = resourceHelper.getModelFieldMap('Test');
    expect(testFieldMap).toBeDefined();
  });

  it('returns the same modelFieldMap on subsequent gets', () => {
    const testFieldMap = resourceHelper.getModelFieldMap('Test');
    const anotherFieldMap = resourceHelper.getModelFieldMap('Test');
    expect(testFieldMap).toBe(anotherFieldMap);
  });
});

describe('getFieldNameMapping', () => {
  it('returns fieldName if no model in map', () => {
    expect(resourceHelper.getFieldNameMapping('Test', 'field')).toBe('field');
  });

  it('returns fieldName if no fields in map', () => {
    resourceHelper.getModelFieldMap('Test');
    expect(resourceHelper.getFieldNameMapping('Test', 'field')).toBe('field');
  });

  it('returns fieldName if field not in map', () => {
    resourceHelper.getModelFieldMap('Test').addMappedField({ originalFieldName: 'origTest', currentFieldName: 'currTest' });
    expect(resourceHelper.getFieldNameMapping('Test', 'field')).toBe('field');
  });

  it('returns mapped field if in field map', () => {
    resourceHelper.getModelFieldMap('Test').addMappedField({ originalFieldName: 'origTest', currentFieldName: 'currTest' });
    expect(resourceHelper.getFieldNameMapping('Test', 'currTest')).toBe('origTest');
  });
});

describe('getModelFieldMapKeys', () => {
  it('returns the modelNameMap keys as an array', () => {
    resourceHelper.getModelFieldMap('Test');
    resourceHelper.getModelFieldMap('Another');
    expect(resourceHelper.getModelFieldMapKeys()).toEqual(expect.arrayContaining(['Test', 'Another']));
  });
});

const getResourceHelper = (bindApi = true) => {
  const resourceHelper = new TransformerResourceHelper({
    getParameter: () => ({ valueAsString: testEnv } as CfnParameter),
  } as unknown as StackManager);
  if (bindApi) {
    resourceHelper.bind({ apiId: testApiId } as GraphQLAPIProvider);
  }
  return resourceHelper;
};
