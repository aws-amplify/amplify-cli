# GraphQL @searchable Transformer

# Reference Documentation

### @searchable

The `@searchable` directive handles streaming the data of an `@model` object type to
Elasticsearch and configures search resolvers that search that information.

#### Definition

```graphql
# Streams data from dynamodb into elasticsearch and exposes search capabilities.
directive @searchable(queries: SearchableQueryMap) on OBJECT
input SearchableQueryMap {
  search: String
}
```
