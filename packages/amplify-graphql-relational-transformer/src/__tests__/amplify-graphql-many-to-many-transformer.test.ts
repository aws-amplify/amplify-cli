/* eslint-disable */
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { DocumentNode, ObjectTypeDefinitionNode, parse } from 'graphql';
import { HasOneTransformer, ManyToManyTransformer } from '..';
import { featureFlags } from './test-helpers';

jest.mock('amplify-prompts');

test('fails if @manyToMany was used on an object that is not a model type', () => {
  const inputSchema = `
    type Foo {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError(`@manyToMany must be on an @model object type field.`);
});

test('fails if the related type does not exist', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Baz] @manyToMany(relationName: "FooBar")
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError('Unknown type "Baz". Did you mean "Bar"?');
});

test('fails if used on a non-list type', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: Bar @manyToMany(relationName: "FooBar")
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError('@manyToMany must be used with a list.');
});

test('fails if a relation is used in less than two places', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Bar]
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError(`@manyToMany relation 'FooBar' must be used in exactly two locations.`);
});

test('fails if a relation is used in more than two places', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }

    type Baz @model {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError(`@manyToMany relation 'FooBar' must be used in exactly two locations.`);
});

test('fails if a relation name conflicts with an existing type name', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "foo   Bar")
    }

    type FooBar {
      id: ID!
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "foo   Bar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError(
    `@manyToMany relation name 'FooBar' (derived from 'foo   Bar') already exists as a type in the schema.`,
  );
});

test('fails if first half of relation uses the wrong type', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Baz] @manyToMany(relationName: "FooBar")
    }

    type Baz @model {
      id: ID!
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError(`@manyToMany relation 'FooBar' expects 'Baz' but got 'Bar'.`);
});

test('fails if second half of relation uses the wrong type', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }

    type Baz @model {
      id: ID!
    }

    type Bar @model {
      id: ID!
      foos: [Baz] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();

  expect(() => transformer.transform(inputSchema)).toThrowError(`@manyToMany relation 'FooBar' expects 'Baz' but got 'Foo'.`);
});

test('valid schema', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }

    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.schema).toMatchSnapshot();
  expect(out.resolvers).toMatchSnapshot();
});

test('one of the models with sort key', () => {
  const inputSchema = `
    type ModelA @model {
      id: ID! @primaryKey(sortKeyFields: ["sortId"])
      sortId: ID!
      models: [ModelB] @manyToMany(relationName: "ModelAModelB")
    }

    type ModelB @model {
      id: ID!
      models: [ModelA] @manyToMany(relationName: "ModelAModelB")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.schema).toMatchSnapshot();
  expectObjectAndFields(schema, "ModelAModelB", ["modelAID", "modelAsortId", "modelBID"]);
});

test('both models with sort key', () => {
  const inputSchema = `
    type ModelA @model {
      id: ID! @primaryKey(sortKeyFields: ["sortId"])
      sortId: ID!
      models: [ModelB] @manyToMany(relationName: "ModelAModelB")
    }

    type ModelB @model {
      id: ID! @primaryKey(sortKeyFields: ["sortId"])
      sortId: ID!
      models: [ModelA] @manyToMany(relationName: "ModelAModelB")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.schema).toMatchSnapshot();
  expectObjectAndFields(schema, "ModelAModelB", ["modelAID", "modelAsortId", "modelBID", "modelBsortId"]);
  expect(out.resolvers).toMatchSnapshot();
});

test('models with multiple sort keys', () => {
  const inputSchema = `
    type ModelA @model {
      id: ID! @primaryKey(sortKeyFields: ["sortId", "secondSortId"])
      sortId: ID!
      secondSortId: ID!
      models: [ModelB] @manyToMany(relationName: "ModelAModelB")
    }

    type ModelB @model {
      id: ID! @primaryKey(sortKeyFields: ["sortId"])
      sortId: ID!
      models: [ModelA] @manyToMany(relationName: "ModelAModelB")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.schema).toMatchSnapshot();
  expectObjectAndFields(schema, "ModelAModelB", ["modelAID", "modelAsortId", "modelAsecondSortId", "modelBID", "modelBsortId"]);
});

test('join table inherits auth from first table', () => {
  const inputSchema = `
    type Foo @model @auth(rules: [{ allow: public, provider: apiKey }]) {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }
    type Bar @model {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.resolvers['Query.getFooBar.auth.1.req.vtl']).toEqual(out.resolvers['Query.getFoo.auth.1.req.vtl']);
  expect(out.resolvers['Query.getFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Query.getFoo.postAuth.1.req.vtl']);
  expect(out.resolvers['Query.getFooBar.res.vtl']).toEqual(out.resolvers['Query.getFoo.res.vtl']);
  expect(out.resolvers['Query.listFooBars.auth.1.req.vtl']).toEqual(out.resolvers['Query.listFoos.auth.1.req.vtl']);
  expect(out.resolvers['Query.listFooBars.postAuth.1.req.vtl']).toEqual(out.resolvers['Query.listFoos.postAuth.1.req.vtl']);
  expect(
    out.resolvers['Mutation.createFooBar.auth.1.req.vtl'].replace('#set( $allowedFields = ["id","fooID","barID","foo","bar"] )', ''),
  ).toEqual(out.resolvers['Mutation.createFoo.auth.1.req.vtl'].replace('#set( $allowedFields = ["id","bars"] )', ''));
  expect(out.resolvers['Mutation.createFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Mutation.createFoo.postAuth.1.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.req.vtl']).toEqual(out.resolvers['Mutation.deleteFoo.auth.1.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Mutation.deleteFoo.postAuth.1.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.res.vtl']).toEqual(out.resolvers['Mutation.deleteFoo.auth.1.res.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.req.vtl']).toEqual(out.resolvers['Mutation.deleteFoo.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.res.vtl']).toEqual(out.resolvers['Mutation.deleteFoo.res.vtl']);
  expect(out.resolvers['Mutation.updateFooBar.auth.1.req.vtl']).toEqual(out.resolvers['Mutation.updateFoo.auth.1.req.vtl']);
  expect(out.resolvers['Mutation.updateFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Mutation.updateFoo.postAuth.1.req.vtl']);
  expect(
    out.resolvers['Mutation.updateFooBar.auth.1.res.vtl']
      .replace('#set( $allowedFields = ["id","fooID","barID","foo","bar"] )', '')
      .replace('#set( $nullAllowedFields = ["id","fooID","barID","foo","bar"] )', ''),
  ).toEqual(
    out.resolvers['Mutation.updateFoo.auth.1.res.vtl']
      .replace('#set( $allowedFields = ["id","bars"] )', '')
      .replace('#set( $nullAllowedFields = ["id","bars"] )', ''),
  );
  expect(out.resolvers['Mutation.updateFooBar.req.vtl']).toEqual(out.resolvers['Mutation.updateFoo.req.vtl']);
  expect(out.resolvers['Mutation.updateFooBar.res.vtl']).toEqual(out.resolvers['Mutation.updateFoo.res.vtl']);
});

test('join table inherits auth from second table', () => {
  const inputSchema = `
    type Foo @model {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }
    type Bar @model @auth(rules: [{ allow: public, provider: apiKey }]) {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.resolvers['Query.getFooBar.auth.1.req.vtl']).toEqual(out.resolvers['Query.getBar.auth.1.req.vtl']);
  expect(out.resolvers['Query.getFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Query.getBar.postAuth.1.req.vtl']);
  expect(out.resolvers['Query.getFooBar.res.vtl']).toEqual(out.resolvers['Query.getBar.res.vtl']);
  expect(out.resolvers['Query.listFooBars.auth.1.req.vtl']).toEqual(out.resolvers['Query.listBars.auth.1.req.vtl']);
  expect(out.resolvers['Query.listFooBars.postAuth.1.req.vtl']).toEqual(out.resolvers['Query.listBars.postAuth.1.req.vtl']);
  expect(
    out.resolvers['Mutation.createFooBar.auth.1.req.vtl'].replace('#set( $allowedFields = ["id","fooID","barID","foo","bar"] )', ''),
  ).toEqual(out.resolvers['Mutation.createBar.auth.1.req.vtl'].replace('#set( $allowedFields = ["id","foos"] )', ''));
  expect(out.resolvers['Mutation.createFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Mutation.createBar.postAuth.1.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.req.vtl']).toEqual(out.resolvers['Mutation.deleteBar.auth.1.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Mutation.deleteBar.postAuth.1.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.res.vtl']).toEqual(out.resolvers['Mutation.deleteBar.auth.1.res.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.req.vtl']).toEqual(out.resolvers['Mutation.deleteBar.req.vtl']);
  expect(out.resolvers['Mutation.deleteFooBar.res.vtl']).toEqual(out.resolvers['Mutation.deleteBar.res.vtl']);
  expect(out.resolvers['Mutation.updateFooBar.auth.1.req.vtl']).toEqual(out.resolvers['Mutation.updateBar.auth.1.req.vtl']);
  expect(out.resolvers['Mutation.updateFooBar.postAuth.1.req.vtl']).toEqual(out.resolvers['Mutation.updateBar.postAuth.1.req.vtl']);
  expect(
    out.resolvers['Mutation.updateFooBar.auth.1.res.vtl']
      .replace('#set( $allowedFields = ["id","fooID","barID","foo","bar"] )', '')
      .replace('#set( $nullAllowedFields = ["id","fooID","barID","foo","bar"] )', ''),
  ).toEqual(
    out.resolvers['Mutation.updateBar.auth.1.res.vtl']
      .replace('#set( $allowedFields = ["id","foos"] )', '')
      .replace('#set( $nullAllowedFields = ["id","foos"] )', ''),
  );
  expect(out.resolvers['Mutation.updateFooBar.req.vtl']).toEqual(out.resolvers['Mutation.updateBar.req.vtl']);
  expect(out.resolvers['Mutation.updateFooBar.res.vtl']).toEqual(out.resolvers['Mutation.updateBar.res.vtl']);
});

test('join table inherits auth from both tables', () => {
  const inputSchema = `
    type Foo @model @auth(rules: [{ allow: public, provider: iam }]) {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }
    type Bar @model @auth(rules: [{ allow: public, provider: apiKey }]) {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.resolvers['Query.getFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.getFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.getFooBar.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listFooBars.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listFooBars.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.createFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.createFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.auth.1.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.res.vtl']).toMatchSnapshot();
});

test('join table inherits auth from tables with similar rules', () => {
  const inputSchema = `
    type Foo @model @auth(rules: [{ allow: owner }, { allow: private, provider: iam }]) {
      id: ID!
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }
    type Bar @model @auth(rules: [{ allow: owner }, { allow: public, provider: apiKey }]) {
      id: ID!
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer({
    defaultAuthentication: {
      authenticationType: 'API_KEY',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }, { authenticationType: 'AMAZON_COGNITO_USER_POOLS' }],
  });
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);

  expect(out.resolvers['Query.getFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.getFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.getFooBar.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listFooBars.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Query.listFooBars.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.createFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.createFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.auth.1.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.deleteFooBar.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.auth.1.res.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.req.vtl']).toMatchSnapshot();
  expect(out.resolvers['Mutation.updateFooBar.res.vtl']).toMatchSnapshot();
});

test('creates join table with implicitly defined primary keys', () => {
  const inputSchema = `
    type Foo @model {
      fooName: String
      bars: [Bar] @manyToMany(relationName: "FooBar")
    }
    type Bar @model {
      barName: String
      foos: [Foo] @manyToMany(relationName: "FooBar")
    }`;
  const transformer = createTransformer();
  const out = transformer.transform(inputSchema);
  expect(out).toBeDefined();
  const schema = parse(out.schema);
  validateModelSchema(schema);
});

function createTransformer(authConfig?: AppSyncAuthConfiguration) {
  const transformerAuthConfig: AppSyncAuthConfiguration = authConfig ?? {
    defaultAuthentication: {
      authenticationType: 'API_KEY',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const authTransformer = new AuthTransformer();
  const modelTransformer = new ModelTransformer();
  const indexTransformer = new IndexTransformer();
  const hasOneTransformer = new HasOneTransformer();
  const primaryKeyTransformer = new PrimaryKeyTransformer();
  const transformer = new GraphQLTransform({
    authConfig: transformerAuthConfig,
    transformers: [
      modelTransformer,
      primaryKeyTransformer,
      indexTransformer,
      hasOneTransformer,
      new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer, authTransformer),
      authTransformer,
    ],
    featureFlags,
  });

  return transformer;
}

function expectObjectAndFields(schema: DocumentNode, type: String, fields: String[]) {
  const relationModel = schema.definitions.find(def => def.kind === "ObjectTypeDefinition" && def.name.value === type) as ObjectTypeDefinitionNode;
  expect(relationModel).toBeDefined();
  fields.forEach(field => {
    expect(relationModel.fields?.find(f => f.name.value === field)).toBeDefined();
  });
}
/* eslint-enable */
