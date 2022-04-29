import { SchemaDefinitionNode, Kind } from 'graphql';
export const DEFAULT_SCHEMA_DEFINITION: SchemaDefinitionNode = {
  kind: Kind.SCHEMA_DEFINITION,
  directives: [],
  operationTypes: [
    {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation: 'query',
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'Query',
        },
      },
    },
    {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation: 'mutation',
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'Mutation',
        },
      },
    },
    {
      kind: Kind.OPERATION_TYPE_DEFINITION,
      operation: 'subscription',
      type: {
        kind: Kind.NAMED_TYPE,
        name: {
          kind: Kind.NAME,
          value: 'Subscription',
        },
      },
    },
  ],
};

