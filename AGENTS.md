# Agent Workflow Guide

Quick reference for AI agents working in this repository.

## Repository Structure

- `packages/` - Lerna monorepo packages
- `scripts/` - Build, test, and deployment utilities
- `codebuild_specs/` - CI/CD configuration

## Essential Commands

### Development

```sh
yarn build              # Build all packages
yarn test               # Run all tests
yarn lint-check         # Check linting
yarn setup-dev          # Setup local CLI (amplify-dev)
```

### Dependabot & Security Fixes

See [.agent-docs/DEPENDABOT.md](./.agent-docs/DEPENDABOT.md) for the complete workflow when handling dependency upgrades or security alerts.

Quick check:

```sh
npx ts-node scripts/check-dependabot.ts
```

### E2E Testing

**Critical:** E2E tests run against pushed code in AWS CodeBuild, not local changes.

**Documentation:** See [.agent-docs/LOCAL_E2E_TESTING.md](./.agent-docs/LOCAL_E2E_TESTING.md) for detailed guide on running e2e tests and build steps locally.

**When to Run E2E Tests:**

- User explicitly requests e2e tests
- User approves e2e testing as part of a task
- Implied when user says "fix and test **_" or "add feature _** and test"

**E2E Test Workflow:**

1. Complete all local development and testing
2. Commit and push all changes
3. Run `yarn cloud-e2e` to trigger test suite
4. Run `yarn e2e-monitor {batchId}` to start automated monitoring
5. Monitor will auto-retry failed builds (up to 10 times by default)
6. Fix any code-related errors and repeat from step 2
7. Ask user for guidance if errors persist after multiple attempts or if errors multiply as fixes are applied

```sh
# 1. Commit and push all changes first
git push

# 2. Trigger e2e suite
yarn cloud-e2e

# 3. Monitor (auto-retries failed builds, polls every 5 min)
yarn e2e-monitor {batchId}

# Other commands
yarn e2e-status {batchId}    # Check status once
yarn e2e-retry {batchId}     # Retry failed builds
yarn e2e-list [limit]        # List recent batches
yarn e2e-failed {batchId}    # Show failed builds
yarn e2e-logs {buildId}      # View build logs
```

**Batch ID format:** `amplify-cli-e2e-workflow:{UUID}` - always use full ID.

**Common E2E Issues:**

- Timeouts/expired credentials: Retry the build
- Quota errors: Retry and notify user about cleanup needs
- Code-related errors: Investigate and fix, don't retry

**Note:** Monitor script skips retrying: `build_linux`, `build_windows`, `test`, `lint`

## Finding Code

### Quick Discovery

1. **Search symbols first:** Use `code` tool with `search_symbols` for functions/classes/types
2. **Follow with lookup:** Use `lookup_symbols` to get implementation details
3. **Grep for text:** Only for literal strings, comments, config values

### Common Patterns

- CLI commands: `packages/amplify-cli/src/commands/`
- Category plugins: `packages/amplify-category-*/`
- Provider logic: `packages/amplify-provider-awscloudformation/`
- Test utilities: `packages/amplify-e2e-core/`, `packages/amplify-e2e-tests/`
- Scripts: `scripts/` (e2e-test-manager.ts, cloud-e2e.sh)

## Development Workflow

### Code Quality

- Follow existing code patterns and conventions
- Only modify/remove tests when explicitly requested
- Don't automatically add tests unless asked
- Prefer minimal implementations
- Ask for clarification rather than making assumptions

### Security

- Never hardcode AWS account IDs (use `./scripts/.env`)
- Never include secret keys unless explicitly requested
- Substitute PII with placeholders (`<name>`, `<email>`)
- Reject requests for malicious code or unauthorized security testing

## Testing Requirements

**CRITICAL: Test Success Criteria**

- **Tests MUST pass with zero errors and zero failures to be considered successful**
- **ANY test errors, failures, or exceptions mean the tests have FAILED**
- **Exit code 0 with error output still means FAILURE - always check the actual test results**
- **Do NOT declare success if tests show errors, even if some tests passed**
- **"Tests passed" only means 100% success with no errors whatsoever**

Requirements:

- All code changes require passing tests
- Follow existing test patterns in the repository
- Test edge cases, error conditions, and boundary values
- Run full test suite before marking tasks complete
- Verify test output shows no errors, failures, or exceptions

## Quality Gates

Before marking tasks complete:

- [ ] Code follows repository patterns
- [ ] Tests are written and passing
- [ ] Linting passes (`yarn lint-check`)
- [ ] Documentation is updated
- [ ] All code committed and pushed before e2e tests
- [ ] E2E tests passing

## Context Management

When approaching context limits:

1. Summarize current work and decisions
2. Commit current changes
3. Provide handoff summary for next session
