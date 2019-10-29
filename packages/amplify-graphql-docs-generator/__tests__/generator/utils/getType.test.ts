import getType from '../../../src/generator/utils/getType';
import { GraphQLScalarType, Kind, GraphQLInt, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLList } from 'graphql';
describe('getType', () => {
  const testObj = new GraphQLObjectType({
    name: 'Address',
    fields: {
      street: { type: GraphQLString },
      number: { type: GraphQLInt },
      requiredInt: { type: new GraphQLNonNull(GraphQLInt) },
      listOfInt: { type: new GraphQLList(GraphQLInt) },
      listOfNonNullInt: { type: new GraphQLNonNull(new GraphQLList(GraphQLInt)) },
    },
  });

  it('should return string type for street', () => {
    expect(getType(testObj.getFields().street.type)).toEqual(GraphQLString);
  });

  it('should return integer type for number', () => {
    expect(getType(testObj.getFields().number.type)).toEqual(GraphQLInt);
  });

  it('should return integer type for a Non-Null integer', () => {
    expect(getType(testObj.getFields().requiredInt.type)).toEqual(GraphQLInt);
  });

  it('should return integer type for list of integer type', () => {
    expect(getType(testObj.getFields().listOfInt.type)).toEqual(GraphQLInt);
  });

  it('should return integer type for a list of non null integer type', () => {
    expect(getType(testObj.getFields().listOfNonNullInt.type)).toEqual(GraphQLInt);
  });
});
