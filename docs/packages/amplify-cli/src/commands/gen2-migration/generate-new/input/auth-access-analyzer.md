# auth-access-analyzer.ts

Parses CloudFormation templates to extract Cognito auth access permissions.

## How It Works

`parseAuthAccessFromTemplate(templateContent)` parses a JSON CloudFormation template and looks for an `AmplifyResourcesPolicy` IAM policy resource. It extracts `cognito-idp:*` actions from the policy statements, then:

1. Checks for complete grouped permissions (e.g., all 13 `manageUsers` actions present → sets `manageUsers: true` instead of individual flags)
2. Maps remaining individual actions to permission keys via `AUTH_ACTION_MAPPING`
3. Expands wildcards (`AdminList*`, `List*`) into their constituent actions

Returns an `AuthAccess` object with boolean flags for each permission.

## Relationship to Other Components

- Called by `AuthGenerator` to determine which functions have auth access
- Reads function CloudFormation templates from the cloud backend via `Gen1App.readCloudBackendFile()`
- The `AuthAccess` type is defined in `auth.renderer.ts`
