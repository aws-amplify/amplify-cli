# Local E2E Testing and Build Simulation

This guide explains how to run e2e test steps and build jobs locally to debug failures before pushing to CI.

## Overview

E2E tests run in AWS CodeBuild with specific build steps defined in `codebuild_specs/*.yml`. Each build spec calls functions from `shared-scripts.sh`. You can simulate these steps locally to debug issues.

## Prerequisites

### Authentication

Most e2e operations require AWS credentials. The repository uses `ada` (Amazon's credential management tool) for authentication, which is called automatically by the scripts.

**Setup:**

1. Ensure you have `ada` and `mwinit` installed
2. Create `scripts/.env` file with account details:
   ```bash
   # scripts/.env
   E2E_ACCOUNT_PROD=<account-id>
   E2E_ACCOUNT_BETA=<account-id>
   ```
3. If you see authentication errors, run `mwinit` in your terminal

**Note:** The scripts automatically call `ada` for credential refresh. You don't need to run `ada` commands manually.

## Common Build Steps

### 1. Unit Tests (`test` build)

**What it does:** Runs all unit tests with coverage in CI mode

**Command:**

```bash
yarn test-ci
```

**Equivalent to:**

```bash
lerna run test --concurrency 4 -- --ci -i
```

**Common issues:**

- Coverage threshold failures: Check `jest.config.js` in the failing package
- Pre-existing coverage issues may not be related to your changes
- To verify if an issue is pre-existing, test on the base branch

### 2. Linting (`lint` build)

**What it does:** Checks code style and linting rules

**Command:**

```bash
yarn lint-check
```

**Common issues:**

- Use `yarn lint-fix` to auto-fix some issues
- Some lint errors require manual fixes
- Check `.eslintrc.js` for linting rules

### 3. Local Registry Publish (`publish_to_local_registry` build)

**What it does:** Publishes packages to a local Verdaccio registry for e2e testing

**Command:**

```bash
# Start Verdaccio (in separate terminal)
yarn verdaccio-start

# Publish packages
yarn publish-to-verdaccio

# Stop Verdaccio when done
yarn verdaccio-stop
```

**Common issues:**

- Requires Verdaccio running locally
- May fail if packages have version conflicts
- Check `lerna.json` for version configuration

### 4. Windows Build (`build_windows` build)

**What it does:** Builds all packages on Windows with Node.js 22 or later

**Command (on Windows):**

```powershell
yarn production-build
yarn build-tests
```

**Command (on macOS/Linux):**
Cannot be fully simulated on non-Windows systems. However, you can:

```bash
yarn production-build
yarn build-tests
```

**Common issues:**

- Path separator differences (Windows uses `\`, Unix uses `/`)
- Line ending differences (CRLF vs LF)
- Case-sensitive filesystem differences
- Windows-specific Node.js modules

### 5. Linux Build (`build_linux` build)

**What it does:** Builds all packages on Linux

**Command:**

```bash
yarn production-build
yarn build-tests
```

**Common issues:**

- Build errors usually indicate TypeScript or dependency issues
- Check for missing dependencies in package.json files

## Debugging E2E Failures

### Step 1: Identify the Failing Build

```bash
yarn e2e-failed <batch-id>
```

This shows which specific builds failed.

### Step 2: Get Build Logs

```bash
yarn e2e-logs <build-id>
```

This downloads and displays the full build log.

### Step 3: Simulate Locally

Run the equivalent local command (see sections above) to reproduce the issue.

### Step 4: Check for Pre-existing Issues

Before fixing, verify the issue exists on the base branch:

```bash
# Stash your changes
git stash

# Checkout base branch
git checkout dev

# Run the failing command
yarn <command>

# Restore your changes
git checkout <your-branch>
git stash pop
```

## E2E Test Workflow

### Full E2E Test Suite

```bash
# 1. Commit and push all changes
git push

# 2. Trigger e2e suite
yarn cloud-e2e

# 3. Monitor with auto-retry
yarn e2e-monitor <batch-id>
```

### Targeted E2E Tests

You can run specific e2e test files locally:

```bash
# Run specific test file
cd packages/amplify-e2e-tests
yarn e2e src/__tests__/api_1.test.ts
```

**Note:** Local e2e tests still require AWS credentials and will create real resources in your AWS account.

## Common Failure Patterns

### 1. Transient Infrastructure Failures

**Symptoms:**

- Timeout errors
- Credential expiration
- Quota/limit errors

**Solution:** Retry the build

```bash
yarn e2e-retry <batch-id>
```

### 2. Code-Related Failures

**Symptoms:**

- Test failures
- Build errors
- Linting errors
- Coverage threshold failures

**Solution:** Fix the code and re-run locally, then push and re-trigger e2e tests

### 3. Dependency-Related Failures

**Symptoms:**

- Module not found errors
- Version conflicts
- Breaking API changes

**Solution:**

- Check if dependency upgrade is necessary
- Look for major version changes that may have breaking changes
- Consider pinning to a compatible version

## Build Job Types

The e2e workflow includes these build types:

- `build_linux` - Build on Linux (not retried by monitor)
- `build_windows` - Build on Windows (not retried by monitor)
- `test` - Run unit tests (not retried by monitor)
- `lint` - Run linting (not retried by monitor)
- `verify_yarn_lock` - Verify yarn.lock consistency
- `publish_to_local_registry` - Publish to Verdaccio
- `amplify_e2e_tests_*` - E2E test suites (multiple jobs)

**Note:** The monitor script skips auto-retrying `build_linux`, `build_windows`, `test`, and `lint` because failures in these are typically code-related and require fixes, not retries.

## Tips

1. **Always test locally first** before pushing to CI
2. **Check pre-commit hooks** - they run tests automatically
3. **Monitor resource usage** - e2e tests create real AWS resources
4. **Clean up resources** - use cleanup scripts periodically
5. **Check credentials** - most failures are due to expired credentials
6. **Read the logs** - build logs contain detailed error information

## Troubleshooting

### "Command failed with exit code 1"

This is a generic error. Check the full output for the actual error message.

### "Cannot read properties of undefined"

Often indicates a dependency version mismatch or breaking API change.

### "Coverage threshold not met"

Check if this is a pre-existing issue by testing on the base branch. Coverage can change due to:

- Code changes
- Dependency updates affecting how coverage is calculated
- Test changes

### "Linting errors"

Run `yarn lint-fix` to auto-fix some issues. Others require manual fixes.

## Related Documentation

- [DEPENDABOT.md](./DEPENDABOT.md) - Dependency update workflow
- [AGENTS.md](../AGENTS.md) - General agent workflow
- [shared-scripts.sh](../shared-scripts.sh) - Build step implementations
