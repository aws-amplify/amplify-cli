/**
 * TODO remove this file once the real migrator is implemented
 */

export const migrateSchemaPlaceholder = (_: string): string => basicV2Schema;

const basicV2Schema = /* GraphQL */ `
  type Blog @model {
    id: ID!
    postID: ID!
    post: Post @hasOne(fields: "postID")
    name: String!
  }

  type Post @model {
    id: ID!
    blogID: ID
    blog: Blog @belongsTo(fields: ["blogID"])
    comments: [Comment] @hasMany(indexName: "byPost")
  }

  type Comment @model {
    id: ID!
    postID: ID! @index(name: "byPost")
    post: Post @belongsTo(fields: ["postID"])
  }
`;
