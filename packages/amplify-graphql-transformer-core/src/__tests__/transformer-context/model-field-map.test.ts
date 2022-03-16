import { ModelFieldMap } from '@aws-amplify/graphql-transformer-interfaces';
import { ModelFieldMapImpl } from '../../transformer-context/model-field-map';

let modelFieldMap: ModelFieldMap;

beforeEach(() => {
  modelFieldMap = new ModelFieldMapImpl();
});

describe('addMappedField', () => {
  it('does not add duplicate entries', () => {
    modelFieldMap.addMappedField({ currentFieldName: 'currTest', originalFieldName: 'origTest' });
    expect(() =>
      modelFieldMap.addMappedField({ currentFieldName: 'currTest', originalFieldName: 'conflictingName' }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Field mapping for [currTest] to [origTest] already exists. Cannot insert mapping to [conflictingName]"`,
    );
  });
});

describe('addResolverReference', () => {
  it('does not add duplicate entries', () => {
    modelFieldMap
      .addResolverReference({ typeName: 'TestType', fieldName: 'testField', isList: false })
      .addResolverReference({ typeName: 'TestType', fieldName: 'testField', isList: false });
    expect(modelFieldMap.getResolverReferences()).toEqual([{ typeName: 'TestType', fieldName: 'testField', isList: false }]);
  });

  it('throws if duplicate entry with different isList value added', () => {
    modelFieldMap.addResolverReference({ typeName: 'TestType', fieldName: 'testField', isList: false });
    expect(() =>
      modelFieldMap.addResolverReference({ typeName: 'TestType', fieldName: 'testField', isList: true }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Resolver of type [TestType] and field [testField] already registered with isList set to [false]"`,
    );
  });
});

describe('getMappedField', () => {
  it('does not allow modification of internal state', () => {
    modelFieldMap.addMappedField({ currentFieldName: 'currTest', originalFieldName: 'origTest' });
    const origGetResult = modelFieldMap.getMappedFields();
    (origGetResult[0] as any).currentFieldName = 'different';
    expect(modelFieldMap.getMappedFields()).toEqual([{ currentFieldName: 'currTest', originalFieldName: 'origTest' }]);
  });
});

describe('getResolverReferences', () => {
  it('does not allow modification of internal state', () => {
    modelFieldMap.addResolverReference({ typeName: 'TestType', fieldName: 'testField', isList: false });
    const origGetResult = modelFieldMap.getResolverReferences();
    (origGetResult[0] as any).fieldName = 'different';
    expect(modelFieldMap.getResolverReferences()).toEqual([{ typeName: 'TestType', fieldName: 'testField', isList: false }]);
  });
});
