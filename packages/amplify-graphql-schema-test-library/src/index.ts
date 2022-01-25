/* eslint-disable no-bitwise */

// The TransformerVersion and TransformerPlatform enums use bit flags to easily combine
// values. For example, if a schema is only supported on JS and iOS, this can be represented
// as (TransformerPlatform.js | TransformerPlatform.ios). Similarly, if a schema is supported
// on all platforms but Flutter with DataStore enabled, the flags can be set like this:
// (TransformerPlatform.all & ~TransformerPlatform.flutterDataStore). Ideally, we should be
// working toward a state where TransformerPlatform.all is the only value needed.

export const enum TransformerVersion {
  v1 = 1 << 0,
  v2 = 1 << 1,
  all = ~0,
}

export const enum TransformerPlatform {
  none = 0,
  api = 1 << 0,
  dataStore = 1 << 1,
  js = 1 << 2,
  jsDataStore = 1 << 3,
  ios = 1 << 4,
  iosDataStore = 1 << 5,
  android = 1 << 6,
  androidDataStore = 1 << 7,
  flutter = 1 << 8,
  flutterDataStore = 1 << 9,
  all = ~0,
}

export type TransformerSchema = {
  description: string;
  transformerVersion: TransformerVersion;
  supportedPlatforms: TransformerPlatform;
  sdl: string;
};

export const schemas: { [key: string]: TransformerSchema } = {
  '@model-simple': {
    description: 'Simple @model schema',
    transformerVersion: TransformerVersion.all,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Todo @model {
        id: ID!
        name: String!
      }
    `,
  },
  'v2-primary-key-with-composite-sort-key': {
    description: '@primaryKey with a composite sort key',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Test @model {
        email: String! @primaryKey(sortKeyFields: ["kind", "other"])
        kind: Int!
        other: AWSDateTime!
        yetAnother: String
        andAnother: String!
      }
    `,
  },
  'v2-index-with-queryfield': {
    description: '@index with queryField',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Test @model {
        email: String!
        createdAt: AWSDateTime!
        category: String! @index(name: "CategoryGSI", sortKeyFields: "createdAt", queryField: "testsByCategory")
        description: String
      }
    `,
  },
  'v2-recursive-has-one-dependency': {
    description: 'Recursive @hasOne relationship',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Item @model {
        id: ID!
        item: Item @hasOne
      }
    `,
  },
  'v2-recursive-has-many-dependency': {
    description: 'Recursive @hasMany relationship',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Item @model {
        id: ID!
        items: [Item] @hasMany
      }
    `,
  },
  'v2-cyclic-has-one-dependency': {
    description: 'Cyclic @hasOne dependency between two models',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms:
      TransformerPlatform.api |
      TransformerPlatform.js |
      TransformerPlatform.ios |
      TransformerPlatform.android |
      TransformerPlatform.flutter,
    sdl: `
      type Blog @model {
        id: ID!
        posts: Post @hasOne
      }
      type Post @model {
        id: ID!
        blog: Blog @hasOne
      }
    `,
  },
  'v2-cyclic-has-many-dependency': {
    description: 'Cyclic @hasMany dependency between two models',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms:
      TransformerPlatform.api |
      TransformerPlatform.js |
      TransformerPlatform.ios |
      TransformerPlatform.android |
      TransformerPlatform.flutter,
    sdl: `
      type Blog @model {
        id: ID!
        posts: [Post] @hasMany
      }
      type Post @model {
        id: ID!
        blog: [Blog] @hasMany
      }
    `,
  },
  '@default-string-value': {
    description: '@default sets a default value for a string field',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Todo @model {
        content: String @default(value: "My new Todo")
      }
    `,
  },
  '@hasOne-implicit-fields': {
    description: '@hasOne with implicit fields parameter',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Project @model {
        id: ID!
        name: String
        team: Team @hasOne
      }

      type Team @model {
        id: ID!
        name: String!
      }
    `,
  },
  '@hasOne-explicit-fields': {
    description: '@hasOne with explicit fields parameter',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Project @model {
        id: ID!
        name: String
        teamID: ID
        team: Team @hasOne(fields: ["teamID"])
      }

      type Team @model {
        id: ID!
        name: String!
      }
    `,
  },
  '@hasMany-implicit-parameters': {
    description: '@hasMany with implicit parameters',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @hasMany
      }

      type Comment @model {
        id: ID!
        content: String!
      }
    `,
  },
  '@hasMany-explicit-parameters': {
    description: '@hasMany with explicit parameters',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @hasMany(indexName: "byPost", fields: ["id"])
      }

      type Comment @model {
        id: ID!
        postID: ID! @index(name: "byPost", sortKeyFields: ["content"])
        content: String!
      }
    `,
  },
  '@hasOne-with-@belongsTo-with-implicit-parameters': {
    description: '@belongsTo with implicit parameters referencing @hasOne',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Project @model {
        id: ID!
        name: String
        team: Team @hasOne
      }

      type Team @model {
        id: ID!
        name: String!
        project: Project @belongsTo
      }
    `,
  },
  '@hasOne-with-@belongsTo-with-explicit-parameters': {
    description: '@belongsTo with explicit parameters referencing @hasOne',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Project @model {
        id: ID!
        name: String
        team: Team @hasOne
      }

      type Team @model {
        id: ID!
        name: String!
        projectID: ID
        project: Project @belongsTo(fields: ["projectID"])
      }
    `,
  },
  '@hasMany-with-@belongsTo-with-implicit-parameters': {
    description: '@belongsTo with implicit parameters referencing @hasMany',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @hasMany(indexName: "byPost", fields: ["id"])
      }

      type Comment @model {
        id: ID!
        postID: ID! @index(name: "byPost", sortKeyFields: ["content"])
        content: String!
        post: Post @belongsTo
      }
    `,
  },
  '@hasMany-with-@belongsTo-with-explicit-parameters': {
    description: '@belongsTo with explicit parameters referencing @hasMany',
    transformerVersion: TransformerVersion.v2,
    supportedPlatforms: TransformerPlatform.all,
    sdl: `
      type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @hasMany(indexName: "byPost", fields: ["id"])
      }

      type Comment @model {
        id: ID!
        postID: ID! @index(name: "byPost", sortKeyFields: ["content"])
        content: String!
        post: Post @belongsTo(fields: ["postID"])
      }
    `,
  },
};
