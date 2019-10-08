import isRequired from '../../../src/generator/utils/isRequired';
import {
  GraphQLScalarType,
  Kind,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInputObjectType,
} from 'graphql';
describe('isRequired', () => {
  const testObj = new GraphQLInputObjectType({
    name: 'Address',
    fields: {
      street: { type: GraphQLString },
      requiredInt: { type: new GraphQLNonNull(GraphQLInt) },
    },
  });

  it('should return false for null types', () => {
    expect(isRequired(testObj.getFields().street.type)).toEqual(false);
  });

  it('should return true for non null types', () => {
    expect(isRequired(testObj.getFields().requiredInt.type)).toEqual(true);
  });
});
