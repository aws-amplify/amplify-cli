//  Used for tests. Directive definition will be passed as part of the configuration
export const directives = /* GraphQL */ `
  # model directive
  directive @model(queries: ModelQueryMap, mutations: ModelMutationMap, subscriptions: ModelSubscriptionMap) on OBJECT
  input ModelMutationMap {
    create: String
    update: String
    delete: String
  }
  input ModelQueryMap {
    get: String
    list: String
  }
  input ModelSubscriptionMap {
    onCreate: [String]
    onUpdate: [String]
    onDelete: [String]
    level: ModelSubscriptionLevel
  }
  enum ModelSubscriptionLevel {
    off
    public
    on
  }

  # Key directive
  directive @key(name: String, fields: [String!]!, queryField: String) on OBJECT

  # Connection directive
  directive @connection(
    name: String
    keyField: String
    sortField: String
    keyName: String
    limit: Int
    fields: [String!]
  ) on FIELD_DEFINITION
`;

export const scalars = [
  'ID',
  'String',
  'Int',
  'Float',
  'Boolean',
  'AWSDate',
  'AWSDateTime',
  'AWSTime',
  'AWSTimestamp',
  'AWSEmail',
  'AWSJSON',
  'AWSURL',
  'AWSPhone',
  'AWSIPAddress',
]
  .map(typeName => `scalar ${typeName}`)
  .join();
