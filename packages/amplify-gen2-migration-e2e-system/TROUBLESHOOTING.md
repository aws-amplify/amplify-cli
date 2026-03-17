# Troubleshooting Guide

## 1. `amplify-dev` binary not found

**Error:**

```
ls: /Users/gandhya/amplify-cli/.bin/amplify-dev: No such file or directory
```

**Cause:** The project hasn't been built yet. The `.bin/` directory and `amplify-dev` symlink are created during the build process.

**Solution:**

```bash
cd /Users/gandhya/amplify-cli
yarn && yarn setup-dev
```

---

## 2. `nvm: command not found`

**Error:**

```
zsh: command not found: nvm
```

**Cause:** `nvm` is not installed. The system uses `fnm` (Fast Node Manager) instead, installed via Homebrew.

**Solution:**

```bash
eval "$(fnm env)"
fnm install 22
fnm use 22
```

---

## 3. `fnm use` fails with environment variable error

**Error:**

```
error: We can't find the necessary environment variables to replace the Node version.
You should setup your shell profile to evaluate `fnm env`
```

**Cause:** `fnm` requires shell integration to be initialized before switching versions.

**Solution:**

```bash
eval "$(fnm env)"
fnm use 22
```

To make this permanent, add `eval "$(fnm env)"` to your `~/.zshrc`.

---

## 4. `posix_spawnp failed` from `node-pty`

**Error:**

```
Error: posix_spawnp failed.
    at new UnixTerminal (node_modules/node-pty/src/unixTerminal.ts:106:22)
```

**Cause:** The `spawn-helper` binary in `node-pty` prebuilds lacked execute permission.

**Solution:**

```bash
chmod +x /Users/gandhya/amplify-cli/node_modules/node-pty/prebuilds/darwin-arm64/spawn-helper
```

**Note:** This issue may also occur if `node-pty` was built for a different Node.js version. The project requires Node.js 22 (per the README). If you're on a different version (e.g. Node 25), switch to Node 22 first, then rebuild:

```bash
eval "$(fnm env)"
fnm use 22
npm rebuild node-pty
```

---

## 5. Multiple AWS credential sources conflict

**Error:**

```
@aws-sdk/credential-provider-node - defaultProvider::fromEnv WARNING:
    Multiple credential sources detected:
    Both AWS_PROFILE and the pair AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY static credentials are set.
```

**Cause:** Both `AWS_PROFILE` and `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` environment variables are set, likely from a previous session or atmosphere setup.

**Solution:**

```bash
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
```

---

## 6. S3 storage trigger times out when functions already exist

**Error:**

```
Category 'storage' failed: Killed the process as no output receive for 300 Sec.

? Select from the following options …  (Use arrow keys or type to filter)
❯ Choose an existing function from the project
  Create a new function
```

**Cause:** The `addS3WithTrigger` e2e-core helper assumed no Lambda functions existed in the project. When functions are already initialized (e.g. auth, function categories), the CLI shows an extra "Select from the following options" prompt that the automation didn't handle.

**Solution:** Updated `addS3WithTrigger` in `amplify-e2e-core/src/categories/storage.ts` to accept an optional `{ projectHasFunctions: true }` flag. When set, it handles the extra prompt by selecting "Create a new function". The category initializer passes this flag based on whether functions were already initialized.

---

## 7. `@auth directive with 'userPools' provider found` during `amplify push`

**Error:**

```
@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.
```

**Cause:** The GraphQL schema uses `{ allow: owner }` auth rules, which implicitly require `userPools` (Cognito) as a provider. However, `addApiWithBlankSchema` only configures the API with the default auth mode (API_KEY) — it doesn't add Cognito User Pools as an additional authorization provider on the API.

**Solution:** Updated the category initializer to use `addApi` with explicit auth types config when the migration config specifies `COGNITO_USER_POOLS` or `IAM` auth modes. Pass `requireAuthSetup = false` as the third argument because the auth category is already initialized — the CLI reuses the existing user pool instead of prompting to create a new one.

```typescript
addApi(
  appPath,
  {
    'API key': {},
    'Amazon Cognito User Pool': {},
    IAM: {},
  },
  false,
); // requireAuthSetup = false
```

---

## 8. API key description prompt times out when using `addApi` with `requireAuthSetup = false`

**Error:**

```
Category 'api' failed: Killed the process as no output receive for 300 Sec.

? Enter a description for the API key: ›
```

**Cause:** The `addApi` helper in `amplify-e2e-core/src/categories/api.ts` uses a single `requireAuthSetup` boolean to gate all auth type setup prompts. When set to `false` (to skip Cognito setup since auth already exists), it also skips API key prompts (description/expiration) — but the CLI always shows those prompts regardless.

**Solution:** Updated `addApi` so that API key and IAM setup are always handled, while Cognito/OIDC setup is conditional on `requireAuthSetup`. Two changes in `amplify-e2e-core/src/categories/api.ts`:

```typescript
// Before (default auth type):
if (requireAuthSetup) setupAuthType(defaultType, chain, authTypesConfig);
// After:
if (requireAuthSetup || defaultType === 'API key' || defaultType === 'IAM') setupAuthType(defaultType, chain, authTypesConfig);

// Before (additional auth types):
if (requireAuthSetup) setupAuthType(authType, chain, authTypesConfig);
// After:
if (requireAuthSetup || authType === 'API key' || authType === 'IAM') setupAuthType(authType, chain, authTypesConfig);
```

This works because:

- **API key** — CLI always prompts for description/expiration, must always be answered
- **IAM** — setup is a no-op, safe to always call
- **Cognito/OIDC** — CLI skips setup prompts when auth already exists, so we skip them too
