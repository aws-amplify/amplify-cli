import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { BelongsToTransformer, HasManyTransformer } from '@aws-amplify/graphql-relational-transformer';
import { MapsToTransformer } from '../../graphql-maps-to-transformer';
import { expectedResolversForModelWithRenamedField } from './common';

const mappedHasMany = /* GraphQL */ `
  type Employee @model @mapsTo(name: "Person") {
    id: ID!
    tasks: [Task] @hasMany
  }

  type Task @model {
    id: ID!
    title: String
  }
`;

const transformSchema = (schema: string) => {
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasManyTransformer(), new BelongsToTransformer(), new MapsToTransformer()],
    sandboxModeEnabled: true,
  });
  return transformer.transform(schema);
};

describe('@mapsTo with @hasMany', () => {
  it('adds CRUD input and output mappings on related type and maps related type in hasMany field resolver', () => {
    const out = transformSchema(mappedHasMany);
    const expectedResolvers: string[] = expectedResolversForModelWithRenamedField('Task').concat('Employee.tasks.postDataLoad.1.res.vtl');
    expectedResolvers.forEach(resolver => {
      expect(out.resolvers[resolver]).toMatchSnapshot();
    });
  });
});
