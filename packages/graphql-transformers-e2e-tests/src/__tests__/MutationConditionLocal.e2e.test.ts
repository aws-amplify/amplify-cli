import { KeyTransformer } from 'graphql-key-transformer';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { VersionedModelTransformer } from 'graphql-versioned-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import {
  DocumentNode,
  parse,
  InputObjectTypeDefinitionNode,
  DefinitionNode,
  Kind,
  InputValueDefinitionNode,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
} from 'graphql';
import { TRANSFORM_CURRENT_VERSION, TRANSFORM_BASE_VERSION, GraphQLTransform } from 'graphql-transformer-core';

jest.setTimeout(2000000);

const transformAndParseSchema = (schema: string, version: number = TRANSFORM_CURRENT_VERSION): DocumentNode => {
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
    transformConfig: {
      Version: version,
    },
  });

  const out = transformer.transform(schema);

  return parse(out.schema);
};

describe(`Local Mutation Condition tests`, () => {
  it('Type without directives', () => {
    const validSchema = `
            type Post
            @model
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

// graphql helper functions
const getInputType = (doc: DocumentNode, typeName: string): InputObjectTypeDefinitionNode => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === typeName);

  expect(type).toBeDefined();

  return <InputObjectTypeDefinitionNode>type;
};

const expectInputTypeDefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeDefined();
};

const expectInputTypeUndefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeUndefined();
};

const expectEnumTypeDefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.ENUM_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeDefined();
};

const expectEnumTypeUndefined = (doc: DocumentNode, typeName: string) => {
  const type = doc.definitions.find((def: DefinitionNode) => def.kind === Kind.ENUM_TYPE_DEFINITION && def.name.value === typeName);
  expect(type).toBeUndefined();
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

describe(`Local V4-V5 Transformer tests`, () => {
  it('V4 transform result', () => {
    const validSchema = `
            type Post
            @model
            {
                id: ID!
                content: String
                rating: Int
                state: State
                stateList: [State]
            }

            enum State {
              DRAFT,
              PUBLISHED
            }
        `;

    const schema = transformAndParseSchema(validSchema, TRANSFORM_BASE_VERSION);

    const filterType = getInputType(schema, 'ModelPostFilterInput');
    expectFieldsOnInputType(filterType, ['id', 'content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);
    doNotExpectFieldsOnInputType(filterType, ['attributeExists']);
    doNotExpectFieldsOnInputType(filterType, ['attributeType']);

    expectInputTypeUndefined(schema, 'ModelPostConditionInput');

    expectInputTypeDefined(schema, 'ModelStringFilterInput');
    expectInputTypeDefined(schema, 'ModelIDFilterInput');
    expectInputTypeDefined(schema, 'ModelIntFilterInput');
    expectInputTypeDefined(schema, 'ModelFloatFilterInput');
    expectInputTypeDefined(schema, 'ModelBooleanFilterInput');
    expectInputTypeDefined(schema, 'ModelStateFilterInput');
    expectInputTypeDefined(schema, 'ModelStateListFilterInput');

    expectInputTypeUndefined(schema, 'ModelSizeInput');
    expectEnumTypeUndefined(schema, 'ModelAttributeTypes');

    const mutation = <ObjectTypeDefinitionNode>(
      schema.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === 'Mutation')
    );
    expect(mutation).toBeDefined();

    const checkMutation = (name: string) => {
      const field = <FieldDefinitionNode>mutation.fields.find(f => f.name.value === `${name}Post`);
      expect(field).toBeDefined();
      const conditionArg = field.arguments.find(a => a.name.value === 'condition');
      expect(conditionArg).toBeUndefined();
    };

    checkMutation('create');
    checkMutation('update');
    checkMutation('delete');
  });

  it(`V5 transform result`, () => {
    const validSchema = `
            type Post
            @model
            {
                id: ID!
                content: String
                rating: Int
                state: State
                stateList: [State]
            }

            enum State {
              DRAFT,
              PUBLISHED
            }
        `;

    const conditionFeatureVersion = 5;
    const schema = transformAndParseSchema(validSchema, conditionFeatureVersion);

    const filterType = getInputType(schema, 'ModelPostFilterInput');
    expectFieldsOnInputType(filterType, ['id', 'content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    const conditionType = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(conditionType, ['content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    expectInputTypeDefined(schema, 'ModelStringInput');
    expectInputTypeDefined(schema, 'ModelIDInput');
    expectInputTypeDefined(schema, 'ModelIntInput');
    expectInputTypeDefined(schema, 'ModelFloatInput');
    expectInputTypeDefined(schema, 'ModelBooleanInput');
    expectInputTypeDefined(schema, 'ModelStateInput');
    expectInputTypeDefined(schema, 'ModelStateListInput');
    expectInputTypeDefined(schema, 'ModelSizeInput');
    expectEnumTypeDefined(schema, 'ModelAttributeTypes');

    const mutation = <ObjectTypeDefinitionNode>(
      schema.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === 'Mutation')
    );
    expect(mutation).toBeDefined();

    const checkMutation = (name: string) => {
      const field = <FieldDefinitionNode>mutation.fields.find(f => f.name.value === `${name}Post`);
      expect(field).toBeDefined();
      const conditionArg = field.arguments.find(a => a.name.value === 'condition');
      expect(conditionArg).toBeDefined();
    };

    checkMutation('create');
    checkMutation('update');
    checkMutation('delete');
  });

  it(`Current version transform result`, () => {
    const validSchema = `
            type Post
            @model
            {
                id: ID!
                content: String
                rating: Int
                state: State
                stateList: [State]
            }

            enum State {
              DRAFT,
              PUBLISHED
            }
        `;

    const schema = transformAndParseSchema(validSchema, TRANSFORM_CURRENT_VERSION);

    const filterType = getInputType(schema, 'ModelPostFilterInput');
    expectFieldsOnInputType(filterType, ['id', 'content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    const conditionType = getInputType(schema, 'ModelPostConditionInput');
    expectFieldsOnInputType(conditionType, ['content', 'rating', 'state', 'stateList', 'and', 'or', 'not']);

    expectInputTypeDefined(schema, 'ModelStringInput');
    expectInputTypeDefined(schema, 'ModelIDInput');
    expectInputTypeDefined(schema, 'ModelIntInput');
    expectInputTypeDefined(schema, 'ModelFloatInput');
    expectInputTypeDefined(schema, 'ModelBooleanInput');
    expectInputTypeDefined(schema, 'ModelStateInput');
    expectInputTypeDefined(schema, 'ModelStateListInput');
    expectInputTypeDefined(schema, 'ModelSizeInput');
    expectEnumTypeDefined(schema, 'ModelAttributeTypes');

    const mutation = <ObjectTypeDefinitionNode>(
      schema.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === 'Mutation')
    );
    expect(mutation).toBeDefined();

    const checkMutation = (name: string) => {
      const field = <FieldDefinitionNode>mutation.fields.find(f => f.name.value === `${name}Post`);
      expect(field).toBeDefined();
      const conditionArg = field.arguments.find(a => a.name.value === 'condition');
      expect(conditionArg).toBeDefined();
    };

    checkMutation('create');
    checkMutation('update');
    checkMutation('delete');
  });
});
