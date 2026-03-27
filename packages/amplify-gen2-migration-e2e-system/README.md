# Amplify Gen 2 Migration E2E System

Automation system for migrating AWS Amplify Gen1 applications to Gen2 with support for multiple apps and all Amplify categories.

## Features

### In-progress
- Test scripts to validate Gen 1 (pre-refactor and post-refactor) and Gen 2 stacks

### Complete
- **Gen2 Migration Commands**: Executes `amplify gen2-migration` CLI commands (lock, generate) after Gen1 push
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

# this tool will use your development Amplify CLI by default: {YOUR_WORKPLACE}/amplify-cli/.bin/amplify-dev
# if your development Amplify CLI is not built, then the tool will fall back to your global install of amplify
# you can override the default behavior by setting AMPLIFY_PATH

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
- `--envName`: Amplify Gen1 environment name to create (defaults to a random 2-10 character lowercase string)
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
- **Gen2MigrationExecutor**: Executes gen2-migration CLI commands (lock, generate, refactor)
- **Logger**: Formatted logging with file output
- **FileManager**, **DirectryManager**: File system operations

### Migration Workflow

The CLI executes the following workflow:

1. **Initialize**: Copy app source, run `amplify init`
2. **Add Categories**: Add configured categories (auth, api, storage, function, analytics)
3. **Push**: Deploy Gen1 app to AWS via `amplify push`
4. **Git Init**: Initialize git repo and commit Gen1 state
5. **Lock**: Lock Gen1 environment via `amplify gen2-migration lock`
6. **Generate**: Generate Gen2 code via `amplify gen2-migration generate`
7. **Post-Generate**: Run app-specific `post-generate.ts` script (if present)
8. **Deploy Gen2**: Deploy Gen2 app via `npx ampx sandbox --once`
9. **Refactor**: Move stateful resources via `amplify gen2-migration refactor`
10. **Post-Refactor**: Run app-specific `post-refactor.ts` script (if present)
11. **Redeploy Gen2**: Redeploy Gen2 app to pick up post-refactor changes

### Post-Generate and Post-Refactor Scripts

Each app in `amplify-migration-apps/` can have optional TypeScript scripts that apply manual edits required during migration:

- **`post-generate.ts`**: Runs after `amplify gen2-migration generate` and before Gen2 deployment
- **`post-refactor.ts`**: Runs after `amplify gen2-migration refactor` and before Gen2 redeployment

These scripts handle app-specific transformations that the migration CLI cannot automate, such as:
- Converting CommonJS Lambda functions to ESM syntax
- Updating frontend imports from `aws-exports` to `amplify_outputs.json`
- Adding IAM policies for cross-resource access (e.g., Kinesis permissions)
- Setting resource names to preserve original Gen1 names after refactor

#### Script Interface

Both scripts must export a function with the following signature:

```typescript
// post-generate.ts
interface PostGenerateOptions {
  appPath: string;   // Path to the deployed app directory
  envName?: string;  // Amplify environment name (e.g., "main", "dev")
}

export async function postGenerate(options: PostGenerateOptions): Promise<void>;

// post-refactor.ts
interface PostRefactorOptions {
  appPath: string;
  envName?: string;
}

export async function postRefactor(options: PostRefactorOptions): Promise<void>;
```

#### Example: post-generate.ts

```typescript
import fs from 'fs/promises';
import path from 'path';

export async function postGenerate(options: PostGenerateOptions): Promise<void> {
  const { appPath } = options;

  // Convert Lambda function from CommonJS to ESM
  const handlerPath = path.join(appPath, 'amplify', 'function', 'myFunction', 'index.js');
  let content = await fs.readFile(handlerPath, 'utf-8');
  content = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {'
  );
  await fs.writeFile(handlerPath, content, 'utf-8');
}
```

#### Loading Mechanism

The CLI dynamically imports these scripts at runtime using `import()`. Scripts are located by path:
- `amplify-migration-apps/<app-name>/post-generate.ts`
- `amplify-migration-apps/<app-name>/post-refactor.ts`

If a script doesn't exist, the step is silently skipped.

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

## FAQ

### 🛑 The security token included in the request is invalid
Please re-authenticate and get new admin credentials for your working environment

### [ERROR] [CDKAssetPublishError] CDK failed to publish assets ∟ Caused by: [ToolkitError] Failed to publish asset 
This is likely a problem with your bootstrap stack in the environment you're deploying to. Please take a look at CDKToolkit in your AWS account.

### Issues with not being able to deploy AppSync APIs
AppSync has a limit of 50 APIs per environment (account/region). Check to see if you have exceeded the limit, and delete the unnecessary ones before trying again.

### Amplify init fails
Consider which `amplify` binary you are using. We recommend building the one in the monorepo and passing it to the tool using `export AMPLIFY_CLI`. Also consider that the maximum number of app allowed by the Amplify console in an environment is 25. Check to see if you have exceeded the limit, and delete the unnecessary ones before trying again.

## License

Apache-2.0
