# Rules for AI Assistants

**IF YOU ARE AN AI ASSISTANT YOU MUST FOLLOW THESE RULES**

## Package Context

This is the `amplify-gen2-migration-e2e-system` package - an automation system for migrating AWS Amplify Gen1 applications to Gen2. It supports multiple apps and all Amplify categories (API, Auth, Storage, Function, Hosting).

## Key Documentation

**Before changing code, reference these files:**
- `README.md` - Package overview, installation, usage, and architecture
- `MIGRATION_CONFIG.md` - Complete API documentation for `migration-config.json` files

## Architecture Overview

```
src/
├── cli.ts                 # CLI entry point (yargs-based)
├── core/                  # Core business logic
│   ├── amplify-initializer.ts    # Amplify project initialization
│   ├── app-selector.ts           # App discovery and selection
│   ├── category-initializer.ts   # Category-specific initialization
│   ├── cdk-atmosphere-integration.ts  # Atmosphere environment support
│   ├── configuration-loader.ts   # JSON config loading/validation
│   └── environment-detector.ts   # Local vs Atmosphere detection
├── interfaces/            # TypeScript interfaces
├── types/                 # TypeScript type definitions
└── utils/                 # Utility modules
    ├── aws-profile-manager.ts    # AWS credential management
    ├── directory-manager.ts      # Directory operations
    ├── file-manager.ts           # File operations
    └── logger.ts                 # Logging with file output
```

## Development Workflow

### Implementation Rules

1. **NO 'any' types allowed.** TypeScript strict mode is enforced.

2. Use relative imports within this package. Use `@aws-amplify/amplify-e2e-core` for cross-package imports.

3. Configuration files live in `amplify-migration-apps/<app-name>/migration-config.json`. Follow the schema in `MIGRATION_CONFIG.md`.

4. Environment detection:
   - **Atmosphere**: Requires `ATMOSPHERE_ENDPOINT` and `DEFAULT_POOL` env vars
   - **Local**: Uses AWS profiles from `~/.aws/`

### Building and Testing

```bash
# Build (from package root)
yarn build

# Unit tests
yarn test

# Integration tests (requires Atmosphere setup)
yarn test:integ

# E2E tests (deploys real Amplify apps)
yarn test:e2e
```

### Running the Migration CLI

The primary test app is `project-boards`. Use this app when testing changes to the migration system.

```bash
# Set AMPLIFY_PATH to your development Amplify CLI
# If you do not set this, the CLI will use the global installation of amplify
export AMPLIFY_PATH={YOUR_WORKPLACE}/amplify-cli/.bin/amplify-dev

# Migrate an app (Project Boards) using the default profile
npx tsx src/cli.ts --app project-boards --profile default

# Dry run (show what would be done, don't deploy any resources)
npx tsx src/cli.ts --dry-run --app discussions --profile default
```

### Test File Naming

- Unit tests: `*.test.ts`
- Integration tests: `*integration*.test.ts`
- E2E tests: `*.e2e.test.ts` or `*.e2e.atmosphere.test.ts`

## Configuration Schema

When modifying `migration-config.json` files, ensure compliance with `MIGRATION_CONFIG.md`. Required fields:
- `app.name`, `app.description`, `app.framework`
- `categories` object with valid category configurations

## Environment Variables

- `AMPLIFY_PATH` - Path to development Amplify CLI binary
- `ATMOSPHERE_ENDPOINT` - Atmosphere service endpoint (for CI)
- `DEFAULT_POOL` - Atmosphere pool identifier (for CI)

For local Atmosphere testing, create `.gamma.env` in package root (git-ignored).

## Commit Guidelines

Follow the root `AGENTS.md` commit format. Use appropriate prefixes:
- `feat:` - New migration features or category support
- `fix:` - Bug fixes in migration logic
- `test:` - Test additions or modifications
- `docs:` - Documentation updates

**ALWAYS FOLLOW THESE RULES WHEN YOU WORK IN THIS PACKAGE**
