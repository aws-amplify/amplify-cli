export default `directive @connection(
  name: String
  keyField: String
  sortField: String
  keyName: String
  limit: Int
  fields: [String!]
) on FIELD_DEFINITION`;
