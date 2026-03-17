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
