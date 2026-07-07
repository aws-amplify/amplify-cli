# Dependabot Upgrade Workflow

Guide for handling Dependabot alerts, dependency upgrades, and security fixes.

## Checking Dependabot Alerts

**Prerequisites:** GitHub CLI (`gh`) must be installed and authenticated.

Install:

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
# See https://github.com/cli/cli#installation
```

Authenticate:

```bash
gh auth login
```

Check alerts:

```bash
npx ts-node scripts/check-dependabot.ts
```

## Workflow for Agents

When asked to handle dependency upgrades, security fixes, or Dependabot issues:

### 1. Check Outstanding Alerts

Run the Dependabot checker to get current alerts.

### 2. Summarize and Categorize

Group alerts into categories:

- **Dependency updates only** - Simple version bumps in package.json
- **Code changes required** - Breaking changes needing code modifications
- **Security fixes** - CVE patches (prioritize by severity: critical > high > medium > low)

Present summary to user with counts per category.

### 3. Ask User for Scope

Confirm what to address:

- All alerts in a single PR?
- Only dependency updates?
- Only security fixes above a certain severity?
- Specific packages?

### 4. Make Changes

For each change:

- Update package.json (or relevant package files)
- Run `yarn install` to update yarn.lock
- Run `yarn build` to verify build succeeds
- Run `yarn test` to verify tests pass
- Fix any breaking changes if needed

### 5. Commit and Push

```bash
git checkout -b dependabot-fixes-YYYY-MM-DD
git add .
git commit -m "fix: address dependabot alerts

- Update package1 to vX.Y.Z
- Update package2 to vX.Y.Z
- Fix breaking changes in ..."
git push origin dependabot-fixes-YYYY-MM-DD
```

### 6. E2E Test

Follow the e2e workflow from AGENTS.md:

```bash
yarn cloud-e2e
yarn e2e-monitor {batchId}
```

### 7. Resolve Errors

- If e2e tests fail due to code issues, fix and repeat from step 4
- If timeouts/quota errors, retry the build
- Ask user for guidance if errors persist after multiple attempts

## Notes

- Always run local tests before pushing
- Group related updates together when possible
- Document breaking changes in commit messages
- Check for peer dependency conflicts after updates
