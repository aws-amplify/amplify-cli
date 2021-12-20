import { DirectiveNode, ObjectTypeDefinitionNode } from 'graphql';
import {
  FieldMapEntry,
  ModelFieldMap,
  TransformerContextProvider,
  TransformerSchemaVisitStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { MapsToTransformer } from '../graphql-maps-to-transformer';
import { attachInputMappingSlot, attachResponseMappingSlot } from '../field-mapping-resolvers';

jest.mock('../field-mapping-resolvers');

const attachInputMappingSlot_mock = attachInputMappingSlot as jest.MockedFunction<typeof attachInputMappingSlot>;
const attachResponseMappingSlot_mock = attachResponseMappingSlot as jest.MockedFunction<typeof attachResponseMappingSlot>;

describe('@mapsTo directive', () => {
  let stubDefinition: ObjectTypeDefinitionNode;
  let stubDirective: DirectiveNode;

  const setModelNameMapping_mock = jest.fn();
  const getResolver_mock = jest.fn();
  const getModelFieldMapKeys_mock = jest.fn();
  const getModelFieldMap_mock = jest.fn();

  const stubTransformerContext = {
    resolvers: {
      getResolver: getResolver_mock,
    },
    resourceHelper: {
      setModelNameMapping: setModelNameMapping_mock,
      getModelFieldMapKeys: getModelFieldMapKeys_mock,
      getModelFieldMap: getModelFieldMap_mock,
    },
  };

  const mapsToTransformer = new MapsToTransformer();

  beforeEach(() => {
    jest.clearAllMocks();

    stubDefinition = {
      name: {
        value: 'TestName',
      },
    } as ObjectTypeDefinitionNode;
    stubDirective = {
      arguments: [
        {
          name: {
            value: 'name',
          },
          value: {
            kind: 'StringValue',
            value: 'OriginalName',
          },
        },
      ],
    } as unknown as DirectiveNode;
  });

  it('requires a name to be specified', () => {
    (stubDirective as any).arguments = [];
    expect(() =>
      mapsToTransformer.object(
        stubDefinition,
        stubDirective,
        stubTransformerContext as unknown as TransformerSchemaVisitStepContextProvider,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`"name is required in @mapsTo directive"`);
  });

  it('requires a string value for name', () => {
    (stubDirective as any).arguments[0].value.kind = 'OtherKind';
    expect(() =>
      mapsToTransformer.object(
        stubDefinition,
        stubDirective,
        stubTransformerContext as unknown as TransformerSchemaVisitStepContextProvider,
      ),
    ).toThrowErrorMatchingInlineSnapshot(`"A single string must be provided for \\"name\\" in @mapsTo directive"`);
  });

  it('registers the rename mapping', () => {
    mapsToTransformer.object(stubDefinition, stubDirective, stubTransformerContext as unknown as TransformerSchemaVisitStepContextProvider);
    expect(setModelNameMapping_mock.mock.calls[0]).toEqual(['TestName', 'OriginalName']);
  });

  it('attaches input and response mapping templates for mutations', () => {
    // setup
    const testFieldMap = [
      {
        currentFieldName: 'newFieldName',
        originalFieldName: 'origFieldName',
      },
    ];
    stubTransformerContext.resourceHelper.getModelFieldMapKeys.mockReturnValueOnce(['TestType']);
    const modelFieldMap: ModelFieldMap = {
      getMappedFields: () => testFieldMap,
      getResolverReferences: () => [
        {
          typeName: 'Mutation',
          fieldName: 'createTestType',
          isList: false,
        },
      ],
    } as unknown as ModelFieldMap;
    stubTransformerContext.resourceHelper.getModelFieldMap.mockReturnValueOnce(modelFieldMap);
    const dummyResolver = { obj: 'this is a dummy resolver' };
    stubTransformerContext.resolvers.getResolver.mockImplementationOnce((typeName: string, fieldName: string) =>
      typeName === 'Mutation' && fieldName === 'createTestType' ? dummyResolver : undefined,
    );

    // test
    mapsToTransformer.generateResolvers(stubTransformerContext as unknown as TransformerContextProvider);

    // assert
    expect(attachInputMappingSlot_mock).toBeCalledTimes(1);
    expect(attachInputMappingSlot_mock).toBeCalledWith({
      resolver: dummyResolver,
      resolverFieldName: 'createTestType',
      resolverTypeName: 'Mutation',
      fieldMap: testFieldMap,
    });
    expect(attachResponseMappingSlot_mock).toBeCalledTimes(1);
    expect(attachResponseMappingSlot_mock).toBeCalledWith({
      slotName: 'postUpdate',
      resolver: dummyResolver,
      resolverFieldName: 'createTestType',
      resolverTypeName: 'Mutation',
      fieldMap: testFieldMap,
      isList: false,
    });
  });

  it('only attaches response mapping templates for queries', () => {
    // setup
    const testFieldMap = [
      {
        currentFieldName: 'newFieldName',
        originalFieldName: 'origFieldName',
      },
    ];
    stubTransformerContext.resourceHelper.getModelFieldMapKeys.mockReturnValueOnce(['TestType']);
    const modelFieldMap: ModelFieldMap = {
      getMappedFields: () => testFieldMap,
      getResolverReferences: () => [
        {
          typeName: 'Query',
          fieldName: 'getTestType',
          isList: false,
        },
      ],
    } as unknown as ModelFieldMap;
    stubTransformerContext.resourceHelper.getModelFieldMap.mockReturnValueOnce(modelFieldMap);
    const dummyResolver = { obj: 'this is a dummy resolver' };
    stubTransformerContext.resolvers.getResolver.mockImplementationOnce((typeName: string, fieldName: string) =>
      typeName === 'Query' && fieldName === 'getTestType' ? dummyResolver : undefined,
    );

    // test
    mapsToTransformer.generateResolvers(stubTransformerContext as unknown as TransformerContextProvider);

    // assert
    expect(attachInputMappingSlot_mock).not.toBeCalled();
    expect(attachResponseMappingSlot_mock).toBeCalledTimes(1);
    expect(attachResponseMappingSlot_mock).toBeCalledWith({
      slotName: 'postDataLoad',
      resolver: dummyResolver,
      resolverFieldName: 'getTestType',
      resolverTypeName: 'Query',
      fieldMap: testFieldMap,
      isList: false,
    });
  });

  it('does not attach mappings if no resolver found', () => {
    // setup
    const testFieldMap = [
      {
        currentFieldName: 'newFieldName',
        originalFieldName: 'origFieldName',
      },
    ];
    stubTransformerContext.resourceHelper.getModelFieldMapKeys.mockReturnValueOnce(['TestType']);
    const modelFieldMap: ModelFieldMap = {
      getMappedFields: () => testFieldMap,
      getResolverReferences: () => [
        {
          typeName: 'Query',
          fieldName: 'getTestType',
          isList: false,
        },
      ],
    } as unknown as ModelFieldMap;
    stubTransformerContext.resourceHelper.getModelFieldMap.mockReturnValueOnce(modelFieldMap);
    stubTransformerContext.resolvers.getResolver.mockReturnValueOnce(undefined);

    // test
    mapsToTransformer.generateResolvers(stubTransformerContext as unknown as TransformerContextProvider);

    // assert
    expect(attachInputMappingSlot_mock).not.toBeCalled();
    expect(attachResponseMappingSlot_mock).not.toBeCalled();
  });

  it('does not attach resolvers if no mappings defined', () => {
    // setup
    const testFieldMap: FieldMapEntry[] = [];
    stubTransformerContext.resourceHelper.getModelFieldMapKeys.mockReturnValueOnce(['TestType']);
    const modelFieldMap: ModelFieldMap = {
      getMappedFields: () => testFieldMap,
      getResolverReferences: () => [
        {
          typeName: 'Query',
          fieldName: 'getTestType',
          isList: false,
        },
      ],
    } as unknown as ModelFieldMap;
    stubTransformerContext.resourceHelper.getModelFieldMap.mockReturnValueOnce(modelFieldMap);
    stubTransformerContext.resolvers.getResolver.mockReturnValueOnce(undefined);

    // test
    mapsToTransformer.generateResolvers(stubTransformerContext as unknown as TransformerContextProvider);

    // assert
    expect(attachInputMappingSlot_mock).not.toBeCalled();
    expect(attachResponseMappingSlot_mock).not.toBeCalled();
  });
});
