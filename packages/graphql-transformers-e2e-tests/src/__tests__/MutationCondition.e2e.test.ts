import GraphQLTransform from 'graphql-transformer-core';
import KeyTransformer from 'graphql-key-transformer';
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer';
import { parse } from 'graphql/language/parser';
import { DocumentNode, InputObjectTypeDefinitionNode, InputValueDefinitionNode, DefinitionNode, Kind } from 'graphql';
import VersionedModelTransformer from 'graphql-versioned-transformer';
import ModelConnectionTransformer from 'graphql-connection-transformer';
import ModelAuthTransformer from 'graphql-auth-transformer';

const transformAndParseSchema = (schema: string): DocumentNode => {
  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new VersionedModelTransformer(),
      new KeyTransformer(),
      new ModelConnectionTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });

  const out = transformer.transform(schema);

  return parse(out.schema);
};

const getInputType = (doc: DocumentNode, typeName: string): InputObjectTypeDefinitionNode => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === typeName);

  expect(type).toBeDefined();

  return <InputObjectTypeDefinitionNode>type;
};

const expectFieldsOnInputType = (type: InputObjectTypeDefinitionNode, fields: string[]) => {
  expect(type.fields.length).toEqual(fields.length);

  for (const fieldName of fields) {
    const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
};

const doNotExpectFieldsOnInputType = (type: InputObjectTypeDefinitionNode, fields: string[]) => {
  for (const fieldName of fields) {
    const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeUndefined();
  }
};

describe(`Local Mutation Condition tests`, () => {
  beforeAll(() => {});

  it('Type without directives', () => {
    const validSchema = `
            type Post
            @model
            # @versioned
            # @versioned(versionField: "vv", versionInput: "ww")
            # @auth(rules: [
            #   {
            #     allow: owner
            #   }
            #   {
            #     allow: groups
            #   }
            #   {
            #     allow: owner
            #     ownerField: "author"
            #   }
            #   {
            #     allow: groups
            #     groupsField: "editors"
            #   }
            # ])
            # @key(fields: ["id", "type", "slug"])
            # @key(name: "byTypeSlugCounter", fields: ["type", "slug", "likeCount"])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });

  it('Type with primary @key - single field - directive', () => {
    const validSchema = `
            type Post
            @model
            @key(fields: ["id"])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });

  it('Type with primary @key - multiple field - directive', () => {
    const validSchema = `
            type Post
            @model
            @key(fields: ["id", "type", "slug"])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'type', 'slug']);
  });

  it('Type with @auth directive - owner', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: owner
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'owner']);
  });

  it('Type with @auth directive - owner custom field name', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: owner
                    ownerField: "author"
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'author']);
  });

  it('Type with @auth directive - groups', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: groups
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'groups']);
  });

  it('Type with @auth directive - groups custom field name', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
                {
                    allow: groups
                    groupsField: "editors"
                }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id', 'editors']);
  });

  it('Type with @auth directive - multiple rules', () => {
    const validSchema = `
            type Post
            @model
            @auth(rules: [
            {
                allow: owner
            }
            {
                allow: groups
            }
            {
                allow: owner
                ownerField: "author"
            }
            {
                allow: groups
                groupsField: "editors"
            }
            ])
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, ['content', 'type', 'category', 'slug', 'likeCount', 'rating', 'and', 'or', 'not']);
    doNotExpectFieldsOnInputType(type, ['id', 'author', 'editors', 'owner', 'groups']);
  });

  it('Type with @versioned directive - no changes on condition', () => {
    const validSchema = `
            type Post
            @model
            @versioned
            # @versioned(versionField: "vv", versionInput: "ww")
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });

  it('Type with @versioned directive - custom field, no changes on condition', () => {
    const validSchema = `
            type Post
            @model
            @versioned(versionField: "version", versionInput: "requiredVersion")
            {
                id: ID!
                content: String
                type: String!
                category: String
                author: String
                editors: [String!]
                owner: String
                groups: [String!]
                slug: String!
                likeCount: Int
                rating: Int
            }
        `;

    const schema = transformAndParseSchema(validSchema);

    const type = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(type, [
      'content',
      'type',
      'category',
      'author',
      'editors',
      'owner',
      'groups',
      'slug',
      'likeCount',
      'rating',
      'and',
      'or',
      'not',
    ]);
    doNotExpectFieldsOnInputType(type, ['id']);
  });
});

describe(`"Deployed Mutation Condition tests`, () => {
  beforeAll(() => {});

  afterAll(() => {});
});
