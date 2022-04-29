import { parse } from 'graphql';
import { validateModelSchema } from '../validation';

describe('validateModelSchema', () => {
  it('should return no error when the schema is valid', () => {
    const schema = parse(/* GraphQL */ `
      type Post {
        id: ID!
        title: String!
        content: String!
      }
    `);
    const errors = validateModelSchema(schema);
    expect(errors).toHaveLength(0);
  });

  it('should return error when the document fails to parse due to missing type', () => {
    const schema = parse(/* GraphQL */ `
      type Post {
        id: ID!
        title: String!
        content: MissingType
      }
    `);
    const errors = validateModelSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Unknown type "MissingType".');
  });

  it('should return helpful error when parsing fails due to typo in typename', () => {
    const schema = parse(/* GraphQL */ `
      type Post {
        id: ID!
        title: String!
        content: CustomType1
      }

      type CustomType {
        content: String
      }
    `);
    const errors = validateModelSchema(schema);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('Unknown type "CustomType1". Did you mean "CustomType"?');
  });
});
