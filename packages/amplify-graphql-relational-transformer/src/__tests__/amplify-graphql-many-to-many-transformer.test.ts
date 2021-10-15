import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { parse } from 'graphql';
import { HasOneTransformer, ManyToManyTransformer } from '..';

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
  expect(out.pipelineFunctions).toMatchSnapshot();
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

  expect(out.pipelineFunctions['Query.getFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.getFoo.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Query.getFooBar.postAuth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.getFoo.postAuth.1.req.vtl']);
  expect(out.pipelineFunctions['Query.getFooBar.res.vtl']).toEqual(out.pipelineFunctions['Query.getFoo.res.vtl']);
  expect(out.pipelineFunctions['Query.listFooBars.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.listFoos.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Query.listFooBars.postAuth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.listFoos.postAuth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.createFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Mutation.createFoo.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.createFooBar.postAuth.1.req.vtl']).toEqual(
    out.pipelineFunctions['Mutation.createFoo.postAuth.1.req.vtl'],
  );
  expect(out.pipelineFunctions['Mutation.deleteFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteFoo.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.deleteFooBar.postAuth.1.req.vtl']).toEqual(
    out.pipelineFunctions['Mutation.deleteFoo.postAuth.1.req.vtl'],
  );
  expect(out.pipelineFunctions['Mutation.deleteFooBar.auth.1.res.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteFoo.auth.1.res.vtl']);
  expect(out.pipelineFunctions['Mutation.deleteFooBar.req.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteFoo.req.vtl']);
  expect(out.pipelineFunctions['Mutation.deleteFooBar.res.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteFoo.res.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Mutation.updateFoo.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.postAuth.1.req.vtl']).toEqual(
    out.pipelineFunctions['Mutation.updateFoo.postAuth.1.req.vtl'],
  );
  expect(out.pipelineFunctions['Mutation.updateFooBar.auth.1.res.vtl']).toEqual(out.pipelineFunctions['Mutation.updateFoo.auth.1.res.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.req.vtl']).toEqual(out.pipelineFunctions['Mutation.updateFoo.req.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.res.vtl']).toEqual(out.pipelineFunctions['Mutation.updateFoo.res.vtl']);
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

  expect(out.pipelineFunctions['Query.getFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.getBar.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Query.getFooBar.postAuth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.getBar.postAuth.1.req.vtl']);
  expect(out.pipelineFunctions['Query.getFooBar.res.vtl']).toEqual(out.pipelineFunctions['Query.getBar.res.vtl']);
  expect(out.pipelineFunctions['Query.listFooBars.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.listBars.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Query.listFooBars.postAuth.1.req.vtl']).toEqual(out.pipelineFunctions['Query.listBars.postAuth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.createFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Mutation.createBar.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.createFooBar.postAuth.1.req.vtl']).toEqual(
    out.pipelineFunctions['Mutation.createBar.postAuth.1.req.vtl'],
  );
  expect(out.pipelineFunctions['Mutation.deleteFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteBar.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.deleteFooBar.postAuth.1.req.vtl']).toEqual(
    out.pipelineFunctions['Mutation.deleteBar.postAuth.1.req.vtl'],
  );
  expect(out.pipelineFunctions['Mutation.deleteFooBar.auth.1.res.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteBar.auth.1.res.vtl']);
  expect(out.pipelineFunctions['Mutation.deleteFooBar.req.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteBar.req.vtl']);
  expect(out.pipelineFunctions['Mutation.deleteFooBar.res.vtl']).toEqual(out.pipelineFunctions['Mutation.deleteBar.res.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.auth.1.req.vtl']).toEqual(out.pipelineFunctions['Mutation.updateBar.auth.1.req.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.postAuth.1.req.vtl']).toEqual(
    out.pipelineFunctions['Mutation.updateBar.postAuth.1.req.vtl'],
  );
  expect(out.pipelineFunctions['Mutation.updateFooBar.auth.1.res.vtl']).toEqual(out.pipelineFunctions['Mutation.updateBar.auth.1.res.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.req.vtl']).toEqual(out.pipelineFunctions['Mutation.updateBar.req.vtl']);
  expect(out.pipelineFunctions['Mutation.updateFooBar.res.vtl']).toEqual(out.pipelineFunctions['Mutation.updateBar.res.vtl']);
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

  expect(out.pipelineFunctions['Query.getFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Query.getFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Query.getFooBar.res.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Query.listFooBars.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Query.listFooBars.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.createFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.createFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.deleteFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.deleteFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.deleteFooBar.auth.1.res.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.deleteFooBar.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.deleteFooBar.res.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.updateFooBar.auth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.updateFooBar.postAuth.1.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.updateFooBar.auth.1.res.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.updateFooBar.req.vtl']).toMatchSnapshot();
  expect(out.pipelineFunctions['Mutation.updateFooBar.res.vtl']).toMatchSnapshot();
});

function createTransformer() {
  const authConfig: AppSyncAuthConfiguration = {
    defaultAuthentication: {
      authenticationType: 'API_KEY',
    },
    additionalAuthenticationProviders: [{ authenticationType: 'AWS_IAM' }],
  };
  const authTransformer = new AuthTransformer({ authConfig, addAwsIamAuthInOutputSchema: false });
  const modelTransformer = new ModelTransformer();
  const indexTransformer = new IndexTransformer();
  const hasOneTransformer = new HasOneTransformer();
  const transformer = new GraphQLTransform({
    authConfig,
    transformers: [
      modelTransformer,
      indexTransformer,
      hasOneTransformer,
      new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer, authTransformer),
      authTransformer,
    ],
  });

  return transformer;
}
