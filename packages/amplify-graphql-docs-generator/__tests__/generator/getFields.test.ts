import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLInterfaceType, GraphQLUnionType } from 'graphql';

import getFields from '../../src/generator/getFields';
import getFragment from '../../src/generator/getFragment';
import getType from '../../src/generator/utils/getType';

jest.mock('../../src/generator/getFragment');
describe('getField', () => {
  const nestedType = new GraphQLObjectType({
    name: 'NestedObject',
    fields: () => ({
      level: { type: GraphQLInt },
      subObj: { type: nestedType },
    }),
  });

  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        foo: { type: GraphQLInt },
        nested: { type: nestedType },
      },
    }),
  });

  it('should support simple scalar', () => {
    const queries = schema.getQueryType().getFields();
    expect(getFields(queries.foo, schema, 3, { useExternalFragmentForS3Object: false })).toEqual({
      name: 'foo',
      fields: [],
      fragments: [],
      hasBody: false,
    });
    expect(getFragment).not.toHaveBeenCalled();
  });

  it('it should recursively resolve fields up to max depth', () => {
    const queries = schema.getQueryType().getFields();
    expect(getFields(queries.nested, schema, 2, { useExternalFragmentForS3Object: false })).toEqual({
      name: 'nested',
      fields: [
        {
          name: 'level',
          fields: [],
          fragments: [],
          hasBody: false,
        },
        {
          name: 'subObj',
          fields: [
            {
              name: 'level',
              fields: [],
              fragments: [],
              hasBody: false,
            },
          ],
          fragments: [],
          hasBody: true,
        },
      ],
      fragments: [],
      hasBody: true,
    });
  });

  it('should not return anything for complex type when the depth is < 1', () => {
    const queries = schema.getQueryType().getFields();
    expect(getFields(queries.nested, schema, 0, { useExternalFragmentForS3Object: false })).toBeUndefined();
  });
  describe('When type is an Interface', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
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

    const circleType = new GraphQLObjectType({
      name: 'Circle',
      fields: {
        name: { type: GraphQLString },
        radius: { type: GraphQLInt },
      },
      interfaces: () => [shapeInterfaceType],
    });

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          shapeInterface: { type: shapeInterfaceType },
        },
      }),
      types: [circleType, rectangleType],
    });

    it('interface - should return fragments of all the implementations', () => {
      const maxDepth = 2;
      const getPossibleTypeSpy = jest.spyOn(schema, 'getPossibleTypes');
      getFields(schema.getQueryType().getFields().shapeInterface, schema, maxDepth, { useExternalFragmentForS3Object: false });
      expect(getPossibleTypeSpy).toHaveBeenCalled();
      expect(getFragment).toHaveBeenCalled();

      const commonField = {
        name: 'name',
        fragments: [],
        hasBody: false,
        fields: [],
      };

      expect(getFragment.mock.calls[0][0]).toEqual(circleType);
      expect(getFragment.mock.calls[0][1]).toEqual(schema);
      expect(getFragment.mock.calls[0][2]).toEqual(maxDepth);
      expect(getFragment.mock.calls[0][3]).toEqual([commonField]);

      expect(getFragment.mock.calls[1][0]).toEqual(rectangleType);
      expect(getFragment.mock.calls[1][1]).toEqual(schema);
      expect(getFragment.mock.calls[1][2]).toEqual(maxDepth);
      expect(getFragment.mock.calls[1][3]).toEqual([commonField]);
    });
  });
  describe('When type is an union', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    const rectangleType = new GraphQLObjectType({
      name: 'Rectangle',
      fields: {
        length: { type: GraphQLInt },
        width: { type: GraphQLInt },
      },
    });

    const circleType = new GraphQLObjectType({
      name: 'Circle',
      fields: {
        radius: { type: GraphQLInt },
      },
    });
    const shapeResultUnion = new GraphQLUnionType({
      name: 'ShapeResultUnion',
      types: [circleType, rectangleType],
    });

    const schema = new GraphQLSchema({
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          shapeResult: { type: shapeResultUnion },
        },
      }),
    });

    it('union - should return fragments of all the types', () => {
      const maxDepth = 2;
      const getPossibleTypeSpy = jest.spyOn(schema, 'getPossibleTypes');
      getFields(schema.getQueryType().getFields().shapeResult, schema, maxDepth, { useExternalFragmentForS3Object: false });
      expect(getPossibleTypeSpy).toHaveBeenCalled();
      expect(getFragment).toHaveBeenCalled();

      const commonField = []; // unions don't have to have common field

      expect(getFragment.mock.calls[0][0]).toEqual(circleType);
      expect(getFragment.mock.calls[0][1]).toEqual(schema);
      expect(getFragment.mock.calls[0][2]).toEqual(maxDepth);
      expect(getFragment.mock.calls[0][3]).toEqual(commonField);

      expect(getFragment.mock.calls[1][0]).toEqual(rectangleType);
      expect(getFragment.mock.calls[1][1]).toEqual(schema);
      expect(getFragment.mock.calls[1][2]).toEqual(maxDepth);
      expect(getFragment.mock.calls[1][3]).toEqual(commonField);
    });
  });
});
