# Migration Configuration API

This document describes the complete API for `migration-config.json` files used by the Amplify Migration System.

## Configuration Schema

Each app directory should contain a `migration-config.json` file with the following structure:

```json
{
  "app": {
    "name": "string",
    "description": "string", 
    "complexity": "low" | "medium" | "high",
    "version": "string (optional)"
  },
  "categories": {
    "api": { /* API Configuration */ },
    "auth": { /* Auth Configuration */ },
    "storage": { /* Storage Configuration */ },
    "function": { /* Function Configuration */ },
    "hosting": { /* Hosting Configuration */ }
  },
  "migration": { /* Migration Settings (optional) */ },
  "dependencies": { /* Dependency Configuration (optional) */ }
}
```

## App Metadata

```json
{
  "app": {
    "name": "app-0",
    "description": "Brief description of the application",
    "complexity": "low|medium|high",
    "version": "1.0.0"
  }
}
```

- **name**: App identifier (required)
- **description**: Human-readable description (required)
- **complexity**: Complexity level affecting migration approach (required)
- **version**: App version (optional)

## API Category

```json
{
  "api": {
    "type": "GraphQL" | "REST",
    "schema": "schema.graphql",
    "authModes": ["API_KEY", "COGNITO_USER_POOLS", "IAM", "OIDC"],
    "customQueries": ["listTodos", "getTodosByUser"],
    "customMutations": ["createTodoWithValidation"]
  }
}
```

- **type**: API type (required)
- **schema**: Schema file name for GraphQL APIs
- **authModes**: Array of authorization modes (required)
- **customQueries**: Custom query operations (optional)
- **customMutations**: Custom mutation operations (optional)

## Auth Category

```json
{
  "auth": {
    "signInMethods": ["email", "phone", "username"],
    "socialProviders": ["facebook", "google", "amazon", "apple"],
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

- **signInMethods**: How users can sign in (required)
- **socialProviders**: Third-party authentication providers (required, can be empty array)
- **userPoolConfig**: Cognito User Pool settings (optional)
- **identityPoolConfig**: Cognito Identity Pool settings (optional)

## Storage Category

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

- **buckets**: S3 bucket configurations (required)
- **triggers**: Lambda triggers for S3 events (optional)

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
        ]
      }
    ]
  }
}
```

- **functions**: Array of Lambda function configurations (required)
- **name**: Function name (required)
- **runtime**: Runtime environment (required)
- **template**: Function template (optional)
- **handler**: Entry point (optional)
- **environment**: Environment variables (optional)
- **permissions**: IAM permissions (optional)

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

## Migration Settings (Optional)

```json
{
  "migration": {
    "gen2TargetVersion": "2.0.0",
    "preserveData": true,
    "backupBeforeMigration": true,
    "customMigrationSteps": [
      "Update Lambda runtime to Node.js 18",
      "Migrate DynamoDB table structure"
    ]
  }
}
```

## Dependencies (Optional)

```json
{
  "dependencies": {
    "nodeVersion": "18.x",
    "npmPackages": {
      "aws-amplify": "^6.0.0",
      "@aws-amplify/ui-react": "^6.0.0"
    },
    "amplifyVersion": "12.x"
  }
}
```

## Complete Example

```json
{
  "app": {
    "name": "app-0",
    "description": "Project board app with authentication and file storage",
    "complexity": "medium"
  },
  "categories": {
    "api": {
      "type": "GraphQL",
      "schema": "schema.graphql",
      "authModes": ["API_KEY", "COGNITO_USER_POOLS"]
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

## Validation Rules

1. **Required Fields**: `app.name`, `app.description`, `app.complexity`, `categories`
2. **API Category**: If present, must have `type` and `authModes`
3. **Auth Category**: If present, must have `signInMethods` and `socialProviders` (can be empty array)
4. **Storage Category**: If present, must have `buckets` array with at least one bucket
5. **Function Category**: If present, must have `functions` array with valid function objects
6. **Hosting Category**: If present, must have valid `type`

## Best Practices

1. **Keep it Simple**: Only include categories that are actually used by the app
2. **Accurate Social Providers**: Only list social providers that are actually configured
3. **Realistic Complexity**: 
   - `low`: 1-2 categories
   - `medium`: 3-4 categories  
   - `high`: 5+ categories or complex configurations
4. **Descriptive Names**: Use clear, descriptive names for functions and resources
5. **Environment Variables**: Use environment variables for configuration that varies between environments
