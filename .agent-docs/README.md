# Agentic Infrastructure

This directory contains documentation and workflows for AI agents working in this repository.

## Files

- **DEPENDABOT.md** - Workflow for handling dependency upgrades and security alerts
- **LOCAL_E2E_TESTING.md** - Guide for running e2e tests and build steps locally

## Key Differences from amplify-category-api

This infrastructure is adapted from [amplify-category-api](https://github.com/aws-amplify/amplify-category-api) with the following customizations for amplify-cli-gen1:

### Profile Names

- **amplify-category-api**: Uses `AmplifyAPIE2EProd`
- **amplify-cli-gen1**: Uses `AmplifyE2EProd`

### Batch ID Format

- **amplify-category-api**: `amplify-category-api-e2e-workflow:{UUID}`
- **amplify-cli-gen1**: `amplify-cli-e2e-workflow:{UUID}`

### Repository Structure

- **amplify-category-api**: Focuses on GraphQL transformers and API category
- **amplify-cli-gen1**: Covers all CLI categories and commands

### Common Patterns

Both repos share:

- E2E test management with auto-retry
- Dependabot alert checking
- Smart retry logic (skips build/test/lint jobs)
- 5-minute polling interval
- 10 retry attempts by default
- Failure rate detection (>50% stops retries)

## Usage

See [AGENTS.md](../AGENTS.md) in the root directory for the main workflow guide.
