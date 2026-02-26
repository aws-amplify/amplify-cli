# Amplify Gen 2 Migration E2E System

Automation system for migrating AWS Amplify Gen1 applications to Gen2 with support for multiple apps and all Amplify categories.

## Features

### In-progress
- Gen 2 migration tool commands
- Test scripts to validate Gen 1 (pre-refactor and post-refactor) and Gen 2 stacks

### Complete
- **Category Support**: Full support for API, Auth, Storage, Function, and Hosting categories
- **Environment Detection**: Automatic detection of Atmosphere vs Local environments
- **Flexible Authentication**: Support for AWS profiles and Atmosphere credentials
- **Configuration-Driven**: JSON-based configuration for each app with API documentation

## Installation and build

You may choose to build the entire monorepo, or just a few key components.

### Entire monorepo
Go to the monorepo root and run:
```shell
yarn install
yarn build
```

### Individual packages

If you know how to do this with a one-liner with Lerna, let me know!

Build the CLI if using the development binary. If you do not, this tool will look for the global installation of Amplify CLI from your `PATH`.
```shell
cd packages/amplify-cli
yarn install
yarn build
```

Build the Amplify E2E Core package.
```shell
cd packages/amplify-gen2-migration-e2e-system
yarn install
yarn build
```

Build the Amplify Gen2 Migration E2E System
```shell
cd packages/amplify-gen2-migration-e2e-system
yarn install
yarn build
```

## Usage

### Basic Usage

```shell

# set AMPLIFY_PATH to your development Amplify CLI
# if you do not set this, the next command will use the global installation of amplify
export AMPLIFY_PATH={YOUR_WORKPLACE}/amplify-cli/.bin/amplify-dev

# Migrate an app (Project Boards) using the default profile
npx tsx src/cli.ts --app project-boards --profile default

# Dry run (show what would be done, don't deploy any resources)
npx tsx src/cli.ts --dry-run --app discussions --profile default
```

### CLI Options

- `--app, -a`: Specific app to migrate (e.g., discussions, media-vault)
- `--dry-run, -d`: Show what would be done without executing
- `--verbose, -v`: Enable verbose logging
- `--profile`: AWS profile to use
- `--list-apps, -l`: List available apps and exit

### Examples

```bash
# List all available apps
npx tsx src/cli.ts --list-apps

# Migrate app with verbose logging
npx tsx src/cli.ts --app media-vault --verbose
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
- **Logger**: Formatted logging with file output
- **FileManager**, **DirectryManager**: File system operations

## Development

### Installing
```bash
yarn install
```

### Compiling

```bash
yarn build
```

### Testing

```bash
yarn test # unit tests
yarn test:integ # integ (atmosphere) validation tests, requires atmosphere setup
yarn test:e2e # end-to-end tests (deploys Amplify Apps)
```

### Linting

```bash
yarn lint
yarn lint:fix
```

## Environment Configuration

### Environment Detection

The system detects the environment type based on the presence of specific environment variables:

**Atmosphere Environment Detection:**
- Run `migrate` with `--atmsophere`
- Works only if both variables are present: `ATMOSPHERE_ENDPOINT`, and `DEFAULT_POOL`
- Environment type: `atmosphere`
- Uses CDK Atmosphere client for integration tests
- For runs using the CLI, these variables must be manually set by the operator, to use them in the E2E tests, create a `.gamma.env` file (see below)

**Local Environment Detection:**
- Run `migrate` with `--profile`
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

## Logging

Logs are written to both console and file:
- Console: Colored, formatted output
- File: Structured logs in temp directory

## Error Handling

Error handling with:
- Environment-specific error messages
- Graceful degradation for optional features

## License

Apache-2.0
