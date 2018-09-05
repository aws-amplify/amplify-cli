import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt } from "graphql";

import getFields from "../../src/generator/getFields";
import { getFragment } from "../../src/generator/getFragment";

jest.mock("../../src/generator/getFragment");
describe("getField", () => {
  const schemaDocument = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: "Foo",
      fields: null
    })
  });

  describe("Simple type", () => {
    const addressField = new GraphQLObjectType({
      name: "Address",
      fields: {
        street: { type: GraphQLString },
        zip: { type: GraphQLInt }
      }
    });

    const deepNestedObj = new GraphQLObjectType({
      name: "Lvl1",
      fields: {
        lvl2: {
          type: new GraphQLObjectType({
            name: "Lvl2",
            fields: {
              lvl2Str: { type: GraphQLString },
              lvl3: {
                lvl2Str: { type: GraphQLString },
                type: new GraphQLObjectType({
                  name: "Lvl4",
                  fields: {
                    foo: { type: GraphQLInt }
                  }
                })
              }
            }
          })
        },
        lvl1Str: { type: GraphQLString }
      }
    });

    const queryBody = new GraphQLObjectType({
      name: "Complex object",
      fields: {
        name: { type: GraphQLString },
        address: { type: addressField },
        deepNested: { type: deepNestedObj }
      }
    });

    it("should return the name of the field when its a scalar type", () => {
      expect(getFields(queryBody.getFields().name, schemaDocument, 2)).toEqual({
        name: "name",
        fields: [],
        fragments: [],
        hasBody: false
      });
      expect(getFragment).not.toHaveBeenCalled();
    });

    it("should return a nested object with name when there are fields", () => {
      expect(getFields(queryBody.getFields().address, schemaDocument, 2)).toEqual({
        name: "address",
        fields: [
          {
            name: "street",
            fields: [],
            fragments: [],
            hasBody: false
          },
          {
            name: "zip",
            fields: [],
            fragments: [],
            hasBody: false
          }
        ],
        fragments: [],
        hasBody: true
      });
      expect(getFragment).not.toHaveBeenCalled();
    });

    it("should stop rendering complex fields after 3 levels", () => {
      expect(getFields(queryBody.getFields().deepNested, schemaDocument, 3)).toEqual({
        fragments: [],
        hasBody: true,
        name: "deepNested",
        fields: [
          {
            fragments: [],
            hasBody: true,
            name: "lvl2",
            fields: [
              {
                fields: [],
                fragments: [],
                hasBody: false,
                name: "lvl2Str"
              }
            ]
          },
          {
            fields: [],
            fragments: [],
            hasBody: false,
            name: "lvl1Str"
          }
        ]
      });
      expect(getFragment).not.toHaveBeenCalled();
    });

    it("should not return anything for complex type when the depth is <= 1", () => {
      expect(getFields(queryBody.getFields().address, schemaDocument, 1)).toEqual(undefined);
      expect(getFragment).not.toHaveBeenCalled();
    });
  });
});
