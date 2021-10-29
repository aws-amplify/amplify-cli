import { TestEntry } from './test-case-types';

/**
 * REGISTER TEST CASES HERE
 */
export const getTestCaseRegistry = (): TestEntry[] => [
  {
    name: 'basic bi-di has-one and has-many connection',
    schema: basicBiDiRelationSchema,
  },
  /*
  {
    name: 'add additional tests with a descriptive name',
    schema: schemaName // define the schema below and reference it here. If the schema is exceptionally large, consider importing it from another file
    v1TransformerConfig: // if the tests needs custom v1 transformer config, include it here (the framework currently has limited support for additional config so you may need to make updates)
    v2TransformerConfig: // same for v2 transformer
  }
  */
];

/*
  DEFINE TEST SCHEMAS BELOW
*/

const basicBiDiRelationSchema = /* GraphQL */ `
  type Blog @model {
    id: ID!
    name: String!
    postID: ID
    post: Post @connection(fields: ["postID"])
  }

  type Post @model {
    id: ID!
    title: String!
    blogID: ID!
    blog: Blog @connection(fields: ["blogID"])
    comments: [Comment] @connection(keyName: "byPost", fields: ["id"])
  }

  type Comment @model @key(name: "byPost", fields: ["postID"]) {
    id: ID!
    postID: ID!
    post: Post @connection(fields: ["postID"])
  }
`;
