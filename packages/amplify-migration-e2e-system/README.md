# Amplify Migration System

Comprehensive automation system for migrating AWS Amplify Gen1 applications to Gen2 with support for multiple apps and all Amplify categories.

## Features

### In-progress
- **Category Support**: Full support for API, Auth, Storage, Function, and Hosting categories
- **Reporting**: Detailed logging with progress tracking and report generation
### Complete
- **Environment Detection**: Automatic detection of Atmosphere vs Local environments
- **Flexible Authentication**: Support for AWS profiles and Atmosphere credentials
- **Configuration-Driven**: JSON-based configuration for each app with API documentation

## Installation

```bash
cd amplify-migration-e2e-system
yarn install
yarn build
```

## Usage

### Basic Usage

```bash

# Migrate an app
yarn run migrate -- --app app-2 --profile default

# Dry run (show what would be done)
yarn run migrate -- --dry-run
```

#### Configure for Atmosphere
```bash
./scripts/config-atmosphere.sh # run this script and paste the output into your terminal
```

### CLI Options

- `--app, -a`: Specific app to migrate (e.g., app-2, app-3)
- `--dry-run, -d`: Show what would be done without executing
- `--verbose, -v`: Enable verbose logging
- `--profile`: AWS profile to use
- `--list-apps, -l`: List available apps and exit

### Examples

```bash
# List all available apps
npm run migrate -- --list-apps

# Migrate app with verbose logging
npm run migrate -- --app app-2 --verbose

# Dry run with cleanup
npm run migrate -- --dry-run --cleanup
```

## Configuration

Each app directory should contain a `migration-config.json` file that defines the app's migration requirements. These configurations are manually created based on the comprehensive API documentation in `MIGRATION_CONFIG.md`.

### Configuration Structure

- App metadata (name, description)
- Category configurations (API, Auth, Storage, Function, Hosting)

For complete API documentation and examples, see `MIGRATION_CONFIG.md`.

Example configuration:

```json
{
  "app": {
    "name": "project-boards",
    "description": "Project board app with authentication",
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

## Architecture

The system follows a modular architecture with:

- **ConfigurationLoader**: Manages app-specific configurations
- **EnvironmentDetector**: Detects Atmosphere vs Local environments
- **AppSelector**: Handles app discovery and selection
- **Logger**: Comprehensive logging with file output
- **FileManager**: File system operations

## Development

### Installing
```bash
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
npm run test # integration tests
npm run test:e2e # end-to-end tests (deploys Amplify Apps)
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Environment Configuration

### Environment Detection

The system automatically detects the environment type based on the presence of specific environment variables:

**Atmosphere Environment Detection:**
- Only if BOTH variables are present: `ATMOSPHERE_ENDPOINT`, and `DEFAULT_POOL`
- Environment type: `atmosphere`
- Uses CDK Atmosphere client for integration tests
- For runs using the CLI, these variables must be manually set by the operator

**Local Environment Detection:**
- If ANY of the two atmosphere variables are missing or not set, defaults to `local`
- Environment type: `local`
- Uses AWS profiles from AWS config and credentials files

### Atmosphere Configuration File: `.gamma.env`

Create a `.gamma.env` file in the project root to configure Atmosphere environment:

```bash
# Atmosphere endpoint configuration
# Example format
ATMOSPHERE_ENDPOINT=https://my.atmosphere.endpoint.dev
DEFAULT_POOL=__exp.my-amplify-cli-pool__
```

**Important Notes:**
- `.gamma.env` is git-ignored
- Tests automatically load this file if present, but manual runs require you to set the env vars yourself
- Both variables must be present for Atmosphere environment detection
- Missing or incomplete configuration defaults to Local environment

## Environment Support

### Local Environment
- Uses AWS profiles
- CDK Atmosphere client optional
- No `.gamma.env` file required

### Atmosphere Environment
- Requires `.gamma.env` configuration
- Automatic credential detection through CDK Atmosphere client
- Managed credential lifecycle with automatic cleanup
- Pool-based resource allocation

## Logging

Logs are written to both console and file:
- Console: Colored, formatted output with progress indicators
- File: Structured logs in `./logs/` directory
- Export: JSON export of all log entries

## Error Handling

Error handling with:
- Environment-specific error messages
- Graceful degradation for optional features

## License

Apache-2.0
