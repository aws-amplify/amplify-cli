# GraphQL Relational Modeling Transformers

# Reference Documentation

### @hasOne

The `@hasOne` directive allows you to define "has one" relationships between data.

#### Definition

```graphql
directive @hasOne(fields: [String!]) on FIELD_DEFINITION
```

### @hasMany

The `@hasMany` directive allows you to define "has many" relationships between data.

#### Definition

```graphql
directive @hasMany(indexName: String, fields: [String!], limit: Int = 100) on FIELD_DEFINITION
```

### @belongsTo

The `@belongsTo` directive allows you to define "belongs to" relationships between data.

#### Definition

```graphql
directive @belongsTo(fields: [String!]) on FIELD_DEFINITION
```

### @manyToMany

The `@manyToMany` directive allows you to define "many to many" relationships between data.

#### Definition

```graphql
directive @manyToMany(relationName: String!, limit: Int = 100) on FIELD_DEFINITION
```
