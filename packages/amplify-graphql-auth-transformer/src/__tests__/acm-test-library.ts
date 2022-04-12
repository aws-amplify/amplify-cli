import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';

/**
 * Creates a type that supports several ACM
 * scenarios for testing
 */
export type ACMTest = {
  sdl: string;
  authConfig: AppSyncAuthConfiguration;
  models: {
    name: string;
    validations: {
      roleType: string;
      operations: {
        create: string[];
        read: string[];
        update: string[];
        delete: string[];
      };
    }[];
  }[];
};

export const acmTests: { [key: string]: ACMTest } = {
  'Simple Owner @auth': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple Owner @auth no operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, operations: []}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: [],
              read: [],
              update: [],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Simple Owner @auth with operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, operations: [create, read, update, delete]}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple Owner @auth with subset operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, operations: [create, read, update]}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Field Owner @auth': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: owner}])
        description: String  @auth(rules: [{allow: owner}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field Owner @auth with all operations': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: owner, operations: [create, read, update, delete]}])
        description: String  @auth(rules: [{allow: owner, operations: [create, read, update, delete]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field Owner @auth with subset operations': {
    sdl: `
      type Model @model {
        id: ID  @auth(rules: [{allow: owner, operations: [create, delete]}])
        description: String  @auth(rules: [{allow: owner, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['description'],
              update: ['description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field Owner @auth, field limits type': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner}]) {
        id: ID
        description: String  @auth(rules: [{allow: owner, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field Owner @auth, field expands type': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, operations: [create, read]}]) {
        id: ID
        description: String  @auth(rules: [{allow: owner, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Simple public @auth': {
    sdl: `
      type Model @model @auth(rules: [{ allow: public}]) {
        id: ID
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple public @auth no operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: public, operations: []}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: [],
              read: [],
              update: [],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Simple public type @auth with all operations': {
    sdl: `
      type Model @model @auth(rules: [{ allow: public, operations: [create, read, update, delete]}]) {
        id: ID
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple public type @auth with subset operations': {
    sdl: `
      type Model @model @auth(rules: [{ allow: public, operations: [create, read, update]}]) {
        id: ID
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Field public @auth': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: public}])
        description: String  @auth(rules: [{allow: public}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field public @auth with all operations': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: public, operations: [create, read, update, delete]}])
        description: String  @auth(rules: [{allow: public, operations: [create, read, update, delete]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field public @auth with subset operations': {
    sdl: `
      type Model @model {
        id: ID  @auth(rules: [{allow: public, operations: [create, delete]}])
        description: String  @auth(rules: [{allow: public, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['description'],
              update: ['description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field public @auth, field limits type': {
    sdl: `
      type Model @model @auth(rules: [{allow: public}]) {
        id: ID
        description: String  @auth(rules: [{allow: public, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field public @auth, field expands type': {
    sdl: `
      type Model @model @auth(rules: [{allow: public, operations: [create, read]}]) {
        id: ID
        description: String  @auth(rules: [{allow: public, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'apiKey:public',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Simple private @auth': {
    sdl: `
      type Model @model @auth(rules: [{ allow: private}]) {
        id: ID
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple private @auth no operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: private, operations: []}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: [],
              read: [],
              update: [],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Simple private type @auth with all operations': {
    sdl: `
      type Model @model @auth(rules: [{ allow: private, operations: [create, read, update, delete]}]) {
        id: ID
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple private type @auth with subset operations': {
    sdl: `
      type Model @model @auth(rules: [{ allow: private, operations: [create, read, update]}]) {
        id: ID
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Field private @auth': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: private}])
        description: String  @auth(rules: [{allow: private}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field private @auth with all operations': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: private, operations: [create, read, update, delete]}])
        description: String  @auth(rules: [{allow: private, operations: [create, read, update, delete]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field private @auth with subset operations': {
    sdl: `
      type Model @model {
        id: ID  @auth(rules: [{allow: private, operations: [create, delete]}])
        description: String  @auth(rules: [{allow: private, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['description'],
              update: ['description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field private @auth, field limits type': {
    sdl: `
      type Model @model @auth(rules: [{allow: private}]) {
        id: ID
        description: String  @auth(rules: [{allow: private, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field private @auth, field expands type': {
    sdl: `
      type Model @model @auth(rules: [{allow: private, operations: [create, read]}]) {
        id: ID
        description: String  @auth(rules: [{allow: private, operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Simple Groups @auth': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groups: ["Admin"]}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple Groups @auth no operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groups: ["Admin"], operations: []}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: [],
              read: [],
              update: [],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Simple Groups @auth with operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read, update, delete]}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Simple Groups @auth with subset operations': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read, update]}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Field Groups @auth': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: groups, groups: ["Admin"]}])
        description: String  @auth(rules: [{allow: groups, groups: ["Admin"]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field Groups @auth with all operations': {
    sdl: `
      type Model @model {
        id: ID!  @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read, update, delete]}])
        description: String  @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read, update, delete]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Field Groups @auth with subset operations': {
    sdl: `
      type Model @model {
        id: ID  @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, delete]}])
        description: String  @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['description'],
              update: ['description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field Groups @auth, field limits type': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groups: ["Admin"]}]) {
        id: ID
        description: String  @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id'],
            },
          },
        ],
      },
    ],
  },

  'Type and Field Groups @auth, field expands type': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read]}]) {
        id: ID
        description: String  @auth(rules: [{allow: groups, groups: ["Admin"], operations: [create, read, update]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:staticGroup:Admin:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['description'],
              delete: [],
            },
          },
        ],
      },
    ],
  },

  'Mixed @auth owner and private rules': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner}, { allow: private}]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
          {
            roleType: 'userPools:private',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  'Mixed @auth owner and private rules on type and field': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner}]) {
        id: ID
        description: String @auth(rules: [{ allow: private}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:owner:sub:username',
            operations: {
              create: ['id'],
              read: ['id'],
              update: ['id'],
              delete: ['id'],
            },
          },
          {
            roleType: 'userPools:private',
            operations: {
              create: ['description'],
              read: ['description'],
              update: ['description'],
              delete: ['description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, ownerField: "author" }]) {
        id: ID
        description: String
        author: String @auth(rules: [{allow: owner, ownerField: "author", operations: [create]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:author:sub:username',
            operations: {
              create: ['id', 'description', 'author'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner fields': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, ownerField: "authors" }]) {
        id: ID
        description: String
        authors: [String] @auth(rules: [{allow: owner, ownerField: "authors", operations: [create]}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:authors:sub:username',
            operations: {
              create: ['id', 'description', 'authors'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field and identityClaim': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, ownerField: "author", identityClaim: "sub" }]) {
        id: ID
        description: String
        author: String @auth(rules: [{allow: owner, ownerField: "author", operations: [create], identityClaim: "sub"}])
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:author:sub',
            operations: {
              create: ['id', 'description', 'author'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field on primary key': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, ownerField: "id" }]) {
        id: ID! @primaryKey
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:id:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field on secondary key': {
    sdl: `
      type Model @model @auth(rules: [{allow: owner, ownerField: "description" }]) {
        id: ID!
        description: String @index(name: "byDescription")
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:description:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field on primary and secondary key': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: owner, ownerField: "id" }
          {allow: owner, ownerField: "description" }
        ]) {
        id: ID! @primaryKey
        description: String @index(name: "byDescription")
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:description:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:id:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field on single field': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: owner, ownerField: "description" }
        ]) {
        id: ID! @primaryKey
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:description:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field on multiple fields': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: owner, ownerField: "id" }
          {allow: owner, ownerField: "description" }
        ]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:description:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:id:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field on primary and normal field': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: owner, ownerField: "id" }
          {allow: owner, ownerField: "description" }
        ]) {
        id: ID! @primaryKey
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:description:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:id:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with owner field on secondary index and normal field': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: owner, ownerField: "id" }
          {allow: owner, ownerField: "description" }
        ]) {
        id: ID!
        description: String @index(name: "byDescription")
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:description:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:owner:id:sub:username',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth group with owner field on primary key': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groupsField: "id" }]) {
        id: ID! @primaryKey
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:id:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth owner with group field on secondary key': {
    sdl: `
      type Model @model @auth(rules: [{allow: groups, groupsField: "description" }]) {
        id: ID!
        description: String @index(name: "byDescription")
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:description:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth group with group field on primary and secondary key': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: groups, groupsField: "id" }
          {allow: groups, groupsField: "description" }
        ]) {
        id: ID! @primaryKey
        description: String @index(name: "byDescription")
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:id:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:description:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth group with group field on single field': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: groups, groupsField: "description" }
        ]) {
        id: ID! @primaryKey
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:description:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth group with group field on multiple fields': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: groups, groupsField: "id" }
          {allow: groups, groupsField: "description" }
        ]) {
        id: ID!
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:description:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:id:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth group with group field on primary and normal field': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: groups, groupsField: "id" }
          {allow: groups, groupsField: "description" }
        ]) {
        id: ID! @primaryKey
        description: String
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:id:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:description:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },

  '@auth group with group field on secondary index and normal field': {
    sdl: `
      type Model @model @auth(rules: [
          {allow: groups, groupsField: "id" }
          {allow: groups, groupsField: "description", operations: [create, read] }
        ]) {
        id: ID!
        description: String @index(name: "byDescription")
      }
    `,
    authConfig: {
      defaultAuthentication: {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      },
      additionalAuthenticationProviders: [],
    },
    models: [
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:description:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: [],
              delete: [],
            },
          },
        ],
      },
      {
        name: 'Model',
        validations: [
          {
            roleType: 'userPools:dynamicGroup:id:cognito:groups',
            operations: {
              create: ['id', 'description'],
              read: ['id', 'description'],
              update: ['id', 'description'],
              delete: ['id', 'description'],
            },
          },
        ],
      },
    ],
  },
};
