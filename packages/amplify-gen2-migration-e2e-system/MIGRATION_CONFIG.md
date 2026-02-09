# Migration Configuration API

This document describes the complete API for `migration-config.json` files used by the Amplify Migration System.

## Configuration Schema

Each app directory should contain a `migration-config.json` file with the following structure:

```json
{
  "app": {
    "name": "string",
    "description": "string",
    "framework": "string"
  },
  "categories": {
    "api": { /* API Configuration */ },
    "auth": { /* Auth Configuration */ },
    "storage": { /* Storage Configuration */ },
    "function": { /* Function Configuration */ },
    "hosting": { /* Hosting Configuration */ },
    "restApi": { /* REST API Configuration */ }
  }
}
```

## App Metadata

```json
{
  "app": {
    "name": "app-0",
    "description": "Brief description of the application",
    "framework": "react"
  }
}
```

- **name**: App identifier (required)
- **description**: Human-readable description (required)
- **framework**: App framework - `react`, `none`, etc. (required)

## API Category (GraphQL)

```json
{
  "api": {
    "type": "GraphQL",
    "schema": "schema.graphql",
    "authModes": ["API_KEY", "COGNITO_USER_POOLS", "IAM", "OIDC"],
    "customQueries": ["listTodos", "getTodosByUser"],
    "customMutations": ["createTodoWithValidation"]
  }
}
```

- **type**: API type - `GraphQL` or `REST` (required)
- **schema**: Schema file name for GraphQL APIs (optional)
- **authModes**: Array of authorization modes (required)
- **customQueries**: Custom query operations using `@function` directive (optional)
- **customMutations**: Custom mutation operations using `@function` directive (optional)

## REST API Category

For REST APIs backed by Lambda functions:

```json
{
  "restApi": {
    "name": "nutritionapi",
    "paths": ["/nutrition/log"],
    "lambdaSource": "lognutrition"
  }
}
```

- **name**: REST API friendly name (required)
- **paths**: Array of API paths (required)
- **lambdaSource**: Name of the Lambda function backing the API (required)

## Auth Category

```json
{
  "auth": {
    "signInMethods": ["email", "phone", "username"],
    "socialProviders": ["facebook", "google", "amazon", "apple"],
    "userPoolGroups": ["Admin", "Basic"],
    "triggers": {
      "preSignUp": {
        "type": "email-filter-allowlist"
      }
    },
    "userPoolConfig": {
      "passwordPolicy": {
        "minimumLength": 8,
        "requireLowercase": true,
        "requireUppercase": true,
        "requireNumbers": true,
        "requireSymbols": false
      },
      "mfaConfiguration": {
        "mode": "OFF" | "ON" | "OPTIONAL",
        "smsMessage": "Your verification code is {####}",
        "totpEnabled": false
      },
      "emailVerification": true,
      "phoneVerification": false
    },
    "identityPoolConfig": {
      "allowUnauthenticatedIdentities": false,
      "cognitoIdentityProviders": ["cognito-idp.region.amazonaws.com/userPoolId"]
    }
  }
}
```

- **signInMethods**: How users can sign in - `email`, `phone`, `username` (required)
- **socialProviders**: Third-party authentication providers (required, can be empty array)
- **userPoolGroups**: Cognito User Pool groups (optional)
- **triggers**: Cognito Lambda triggers (optional)
  - **preSignUp**: Pre sign-up trigger configuration
    - **type**: Trigger type - `email-filter-allowlist`, etc.
- **userPoolConfig**: Cognito User Pool settings (optional)
- **identityPoolConfig**: Cognito Identity Pool settings (optional)

## Storage Category

Storage can be either S3 buckets or DynamoDB tables.

### S3 Storage

```json
{
  "storage": {
    "buckets": [
      {
        "name": "images",
        "access": ["public", "protected", "private", "auth", "guest"],
        "cors": {
          "allowedOrigins": ["*"],
          "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
          "allowedHeaders": ["*"],
          "maxAge": 3000
        }
      }
    ],
    "triggers": [
      {
        "name": "imageProcessor",
        "events": ["objectCreated", "objectRemoved"],
        "function": "imageProcessorFunction"
      }
    ]
  }
}
```

- **buckets**: S3 bucket configurations (required for S3 storage)
  - **name**: Bucket friendly name (required)
  - **access**: Access levels - `public`, `protected`, `private`, `auth`, `guest` (required)
  - **cors**: CORS configuration (optional)
- **triggers**: Lambda triggers for S3 events (optional)
  - **name**: Trigger name (required)
  - **events**: S3 events - `objectCreated`, `objectRemoved`, `objectRestore` (required)
  - **function**: Lambda function name to invoke (required)

### DynamoDB Storage

```json
{
  "storage": {
    "type": "dynamodb",
    "tables": [
      {
        "name": "activity",
        "partitionKey": "id",
        "sortKey": "userId",
        "gsi": [
          {
            "name": "byUserId",
            "partitionKey": "userId",
            "sortKey": "timestamp"
          }
        ]
      }
    ]
  }
}
```

- **type**: Storage type - `dynamodb` (required for DynamoDB)
- **tables**: DynamoDB table configurations (required)
  - **name**: Table name (required)
  - **partitionKey**: Partition key attribute name (required)
  - **sortKey**: Sort key attribute name (optional)
  - **gsi**: Global Secondary Indexes (optional)
    - **name**: GSI name (required)
    - **partitionKey**: GSI partition key (required)
    - **sortKey**: GSI sort key (optional)

## Function Category

```json
{
  "function": {
    "functions": [
      {
        "name": "quotegenerator",
        "runtime": "nodejs" | "python" | "java" | "dotnet",
        "template": "hello-world",
        "handler": "index.handler",
        "environment": {
          "TABLE_NAME": "TodoTable",
          "API_ENDPOINT": "https://api.example.com"
        },
        "permissions": [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "s3:GetObject"
        ],
        "trigger": {
          "type": "dynamodb-stream",
          "source": ["Topic", "Post", "Comment"]
        }
      }
    ]
  }
}
```

- **functions**: Array of Lambda function configurations (required)
- **name**: Function name (required)
- **runtime**: Runtime environment - `nodejs`, `python`, `java`, `dotnet` (required)
- **template**: Function template - `hello-world`, `serverless-expressjs`, `lambda-trigger` (optional)
- **handler**: Entry point (optional)
- **environment**: Environment variables (optional)
- **permissions**: IAM permissions (optional)
- **trigger**: Event trigger configuration (optional)
  - **type**: Trigger type - `dynamodb-stream`, `s3`, etc. (required)
  - **source**: Trigger source - model names for DynamoDB streams (required)

## Hosting Category

```json
{
  "hosting": {
    "type": "amplify-console" | "s3-cloudfront",
    "customDomain": "myapp.example.com",
    "sslCertificate": "arn:aws:acm:region:account:certificate/cert-id",
    "buildSettings": {
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "nodeVersion": "18",
      "environmentVariables": {
        "REACT_APP_API_URL": "https://api.example.com"
      }
    }
  }
}
```

- **type**: Hosting type (required)
- **customDomain**: Custom domain name (optional)
- **sslCertificate**: SSL certificate ARN (optional)
- **buildSettings**: Build configuration (optional)

## Complete Examples

### Simple App (project-boards)

```json
{
  "app": {
    "name": "project-boards",
    "description": "Project board app with authentication and file storage",
    "framework": "react"
  },
  "categories": {
    "api": {
      "type": "GraphQL",
      "schema": "schema.graphql",
      "authModes": ["API_KEY"]
    },
    "auth": {
      "signInMethods": ["email"],
      "socialProviders": []
    },
    "storage": {
      "buckets": [
        {
          "name": "images",
          "access": ["auth", "guest"]
        }
      ]
    },
    "function": {
      "functions": [
        {
          "name": "quotegenerator",
          "runtime": "nodejs",
          "template": "hello-world"
        }
      ]
    },
    "hosting": {
      "type": "amplify-console"
    }
  }
}
```

### App with Social Auth and User Groups (media-vault)

```json
{
  "app": {
    "name": "media-vault",
    "description": "Personal media vault with social authentication",
    "framework": "react"
  },
  "categories": {
    "api": {
      "type": "GraphQL",
      "schema": "schema.graphql",
      "authModes": ["COGNITO_USER_POOLS", "API_KEY"]
    },
    "auth": {
      "signInMethods": ["email", "phone"],
      "socialProviders": ["facebook", "google"],
      "userPoolGroups": ["Admin", "Basic"]
    },
    "storage": {
      "buckets": [
        {
          "name": "mediavault",
          "access": ["auth", "guest"]
        }
      ]
    },
    "function": {
      "functions": [
        {
          "name": "thumbnailgen",
          "runtime": "nodejs",
          "template": "hello-world"
        },
        {
          "name": "addusertogroup",
          "runtime": "nodejs",
          "template": "hello-world"
        },
        {
          "name": "removeuserfromgroup",
          "runtime": "nodejs",
          "template": "hello-world"
        }
      ]
    },
    "hosting": {
      "type": "amplify-console"
    }
  }
}
```

### App with REST API and Auth Triggers (fitness-tracker)

```json
{
  "app": {
    "name": "fitness-tracker",
    "description": "Fitness tracking with GraphQL and REST APIs",
    "framework": "react"
  },
  "categories": {
    "api": {
      "type": "GraphQL",
      "schema": "schema.graphql",
      "authModes": ["COGNITO_USER_POOLS", "API_KEY"]
    },
    "auth": {
      "signInMethods": ["username"],
      "socialProviders": [],
      "triggers": {
        "preSignUp": {
          "type": "email-filter-allowlist"
        }
      }
    },
    "restApi": {
      "name": "nutritionapi",
      "paths": ["/nutrition/log"],
      "lambdaSource": "lognutrition"
    },
    "function": {
      "functions": [
        {
          "name": "lognutrition",
          "runtime": "nodejs",
          "template": "serverless-expressjs"
        }
      ]
    },
    "hosting": {
      "type": "amplify-console"
    }
  }
}
```

### App with DynamoDB Storage (discussions)

```json
{
  "app": {
    "name": "discussions",
    "description": "Discussion app with DynamoDB activity logging",
    "framework": "none"
  },
  "categories": {
    "api": {
      "type": "GraphQL",
      "schema": "schema.graphql",
      "authModes": ["API_KEY"],
      "customQueries": ["getUserActivity"],
      "customMutations": ["logUserActivity"]
    },
    "auth": {
      "signInMethods": ["phone"],
      "socialProviders": []
    },
    "storage": {
      "type": "dynamodb",
      "tables": [
        {
          "name": "activity",
          "partitionKey": "id",
          "sortKey": "userId",
          "gsi": [
            {
              "name": "byUserId",
              "partitionKey": "userId",
              "sortKey": "timestamp"
            }
          ]
        }
      ]
    },
    "function": {
      "functions": [
        {
          "name": "fetchuseractivity",
          "runtime": "nodejs",
          "template": "hello-world"
        },
        {
          "name": "recorduseractivity",
          "runtime": "nodejs",
          "template": "lambda-trigger",
          "trigger": {
            "type": "dynamodb-stream",
            "source": ["Topic", "Post", "Comment"]
          }
        }
      ]
    },
    "hosting": {
      "type": "amplify-console"
    }
  }
}
```

## Validation Rules

1. **Required Fields**: `app.name`, `app.description`, `app.framework`, `categories`
2. **API Category**: If present, must have `type` and `authModes`
3. **Auth Category**: If present, must have `signInMethods` and `socialProviders` (can be empty array)
4. **Storage Category**: If S3, must have `buckets` array; if DynamoDB, must have `type: "dynamodb"` and `tables` array
5. **Function Category**: If present, must have `functions` array with valid function objects
6. **Hosting Category**: If present, must have valid `type`
7. **REST API Category**: If present, must have `name`, `paths`, and `lambdaSource`
