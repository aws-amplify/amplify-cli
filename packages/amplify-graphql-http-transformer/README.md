# GraphQL @http Transformer

# Reference Documentation

### @http

The `@http` directive allows you to quickly and easily configure HTTP
resolvers within your AWS AppSync API.

#### Definition

```graphql
directive @http(method: HttpMethod = GET, url: String!, headers: [HttpHeader] = []) on FIELD_DEFINITION
enum HttpMethod {
  GET
  POST
  PUT
  DELETE
  PATCH
}
input HttpHeader {
  key: String
  value: String
}
```
