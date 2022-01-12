import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { BelongsToTransformer, HasOneTransformer } from '@aws-amplify/graphql-relational-transformer';
import { MapsToTransformer } from '../../graphql-maps-to-transformer';

const mappedHasOne = /* GraphQL */ `
  type Employee @model @mapsTo(name: "Person") {
    id: ID!
    task: Task @hasOne
  }

  type Task @model {
    id: ID!
    title: String
  }
`;

const mappedBelongsTo = /* GraphQL */ `
  type Employee @model {
    id: ID!
    task: Task @hasOne
  }

  type Task @model @mapsTo(name: "Todo") {
    id: ID!
    title: String
    employee: Employee @belongsTo
  }
`;

const biDiHasOneMapped = /* GraphQL */ `
  type Employee @model @mapsTo(name: "Person") {
    id: ID!
    task: Task @hasOne
  }

  type Task @model @mapsTo(name: "Todo") {
    id: ID!
    title: String
    employee: Employee @hasOne
  }
`;

const transformSchema = (schema: string) => {
  const transformer = new GraphQLTransform({
    transformers: [new ModelTransformer(), new HasOneTransformer(), new BelongsToTransformer(), new MapsToTransformer()],
    sandboxModeEnabled: true,
  });
  return transformer.transform(schema);
};

describe('@mapsTo with @hasOne', () => {
  it('adds CRUD input and output mappings on hasOne type', () => {
    const out = transformSchema(mappedHasOne);
    const expectedResolvers: string[] = [
      'Mutation.createEmployee.postUpdate.1.res.vtl',
      'Mutation.createEmployee.init.2.req.vtl',
      'Mutation.updateEmployee.postUpdate.1.res.vtl',
      'Mutation.updateEmployee.init.2.req.vtl',
      'Query.getEmployee.postDataLoad.1.res.vtl',
      'Query.listEmployees.postDataLoad.1.res.vtl',
    ];
    expectedResolvers.forEach(resolver => {
      expect(out.resolvers[resolver]).toMatchSnapshot();
    });
  });

  it('if belongsTo related type is renamed, adds mappings when fetching related type through hasOne field', () => {
    const out = transformSchema(mappedBelongsTo);
    expect(out.resolvers['Employee.task.postDataLoad.1.res.vtl']).toMatchInlineSnapshot(`
      "$util.qr($ctx.prev.result.put(\\"taskEmployeeId\\", $ctx.prev.result.todoEmployeeId))
      $util.qr($ctx.prev.result.remove(\\"todoEmployeeId\\"))
      $util.toJson($ctx.prev.result)"
    `);
  });

  it('if bi-di hasOne, remaps foreign key in both types', () => {
    const out = transformSchema(biDiHasOneMapped);
    expect(out.resolvers['Employee.task.postDataLoad.1.res.vtl']).toMatchInlineSnapshot(`
      "$util.qr($ctx.prev.result.put(\\"taskEmployeeId\\", $ctx.prev.result.todoEmployeeId))
      $util.qr($ctx.prev.result.remove(\\"todoEmployeeId\\"))
      $util.toJson($ctx.prev.result)"
    `);
    expect(out.resolvers['Task.employee.postDataLoad.1.res.vtl']).toMatchInlineSnapshot(`
      "$util.qr($ctx.prev.result.put(\\"employeeTaskId\\", $ctx.prev.result.personTaskId))
      $util.qr($ctx.prev.result.remove(\\"personTaskId\\"))
      $util.toJson($ctx.prev.result)"
    `);
  });
});
