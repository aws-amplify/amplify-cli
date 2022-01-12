import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { HasOneTransformer, ManyToManyTransformer } from '@aws-amplify/graphql-relational-transformer';
import { MapsToTransformer } from '../../graphql-maps-to-transformer';
import { IndexTransformer } from '@aws-amplify/graphql-index-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { ObjectTypeDefinitionNode, parse } from 'graphql';

const manyToManyMapped = /* GraphQL */ `
  type Employee @model @mapsTo(name: "Person") {
    id: ID!
    tasks: [Task] @manyToMany(relationName: "EmployeeTasks")
  }

  type Task @model @mapsTo(name: "Todo") {
    id: ID!
    title: String
    employees: [Employee] @manyToMany(relationName: "EmployeeTasks")
  }
`;

const transformSchema = (schema: string) => {
  const indexTransformer = new IndexTransformer();
  const modelTransformer = new ModelTransformer();
  const hasOneTransformer = new HasOneTransformer();
  const authTransformer = new AuthTransformer();
  const transformer = new GraphQLTransform({
    transformers: [
      modelTransformer,
      indexTransformer,
      hasOneTransformer,
      authTransformer,
      new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer, authTransformer),
      new MapsToTransformer(),
    ],
    sandboxModeEnabled: true,
  });
  return transformer.transform(schema);
};

describe('mapsTo with manyToMany', () => {
  it('creates resources with original GSIs and field names', () => {
    const out = transformSchema(manyToManyMapped);
    expect(out.stacks.EmployeeTasks!.Resources!.EmployeeTasksTable.Properties.GlobalSecondaryIndexes).toMatchSnapshot();
    const outSchema = parse(out.schema);
    const employeeTasksFields = (
      outSchema.definitions.find(def => (def as any)?.name.value === 'EmployeeTasks')! as ObjectTypeDefinitionNode
    ).fields!.map(field => field.name.value);
    expect(employeeTasksFields).toEqual(expect.arrayContaining(['id', 'personID', 'todoID', 'todo', 'person', 'createdAt', 'updatedAt']));
  });
});
