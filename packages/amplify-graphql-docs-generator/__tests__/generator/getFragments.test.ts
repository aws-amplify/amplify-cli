import { GraphQLObjectType, GraphQLSchema, GraphQLInterfaceType, GraphQLString, GraphQLInt } from 'graphql';

import { GQLTemplateField, GQLTemplateFragment, GQLDocsGenOptions } from '../../src/generator/types';
import getFields from '../../src/generator/getFields';
import getFragment from '../../src/generator/getFragment';

jest.mock('../../src/generator/getFields');

describe('getFragments', () => {
  const shapeInterfaceType = new GraphQLInterfaceType({
    name: 'Entity',
    fields: {
      name: { type: GraphQLString },
    },
  });
  const rectangleType = new GraphQLObjectType({
    name: 'Rectangle',
    fields: {
      name: { type: GraphQLString },
      length: { type: GraphQLInt },
      width: { type: GraphQLInt },
    },
    interfaces: () => [shapeInterfaceType],
  });

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        shapeInterface: { type: shapeInterfaceType },
        simpleScalar: { type: GraphQLInt },
      },
    }),
    types: [rectangleType],
  });

  beforeEach(() => {
    jest.resetAllMocks();
    getFields.mockImplementation(field => ({ name: field.name }));
  });

  it('should call getField on each field of interface implimentation', () => {
    const impl = schema.getType('Rectangle');
    const currentDepth = 3;
    expect(getFragment(impl, schema, currentDepth, [])).toEqual({
      fields: [{ name: 'name' }, { name: 'length' }, { name: 'width' }],
      on: 'Rectangle',
      external: false,
      name: 'RectangleFragment',
    });
    expect(getFields).toHaveBeenCalledTimes(3);
  });

  it('should decrease the current depth when calling sub fieds', () => {
    const impl = schema.getType('Rectangle');
    const currentDepth = 3;
    getFragment(impl, schema, currentDepth, []);
    expect(getFields.mock.calls[0][2]).toEqual(currentDepth - 1);
  });

  it('should filter out the fields that listed in filterFields', () => {
    const impl = schema.getType('Rectangle');
    const currentDepth = 3;
    const fieldsToFilter = [
      {
        name: 'length',
        hasBody: false,
        fields: [],
        fragments: [],
      },
    ];
    expect(getFragment(impl, schema, currentDepth, fieldsToFilter)).toEqual({
      fields: [{ name: 'name' }, { name: 'width' }],
      on: 'Rectangle',
      name: 'RectangleFragment',
      external: false,
    });
  });

  it('should not render anything if the field is scalar', () => {
    const impl = schema.getQueryType().getFields().simpleScalar;
    const currentDepth = 3;
    expect(getFragment(impl, schema, currentDepth)).toBeUndefined();
  });

  it('should use the name passed as fragment name', () => {
    const impl = schema.getType('Rectangle');
    const currentDepth = 3;
    const fragment = getFragment(impl, schema, currentDepth, [], 'FooFragment');
    expect(fragment.name).toEqual('FooFragment');
  });

  it('should use the mark fragment as external when passed', () => {
    const impl = schema.getType('Rectangle');
    const currentDepth = 3;
    const fragment = getFragment(impl, schema, currentDepth, [], 'FooFragment', true);
    expect(fragment.external).toEqual(true);
  });

  it('should pass the options to getFields call', () => {
    const options: GQLDocsGenOptions = { useExternalFragmentForS3Object: true };
    const impl = schema.getType('Rectangle');
    const currentDepth = 3;
    const fragment = getFragment(impl, schema, currentDepth, [], 'FooFragment', false, options);
    expect(getFields).toHaveBeenCalledTimes(3);
    expect(getFields.mock.calls[0][3]).toEqual(options);
  });
});
