import { IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform, validateModelSchema } from '@aws-amplify/graphql-transformer-core';
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

function createTransformer() {
  const modelTransformer = new ModelTransformer();
  const indexTransformer = new IndexTransformer();
  const hasOneTransformer = new HasOneTransformer();
  const transformer = new GraphQLTransform({
    transformers: [
      modelTransformer,
      indexTransformer,
      hasOneTransformer,
      new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer),
    ],
  });

  return transformer;
}
