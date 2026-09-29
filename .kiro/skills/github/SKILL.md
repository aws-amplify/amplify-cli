---
name: github
description: Read-only GitHub CLI commands for querying PRs, reviews, issues, and repo information
---

# GitHub CLI (Read-Only)

Use the `gh` CLI to query information from GitHub. All commands
are read-only — never use `gh` to create, update, delete, or
push anything.

## Authentication

Assume `gh` is already configured. If a command fails with an
authentication error, the user needs to set up a fine-grained
read-only personal access token:

1. Go to https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Set a token name (e.g., "kiro-readonly")
4. Under "Repository access", select "Public Repositories (read-only)"
5. Click "Generate token" and copy it
6. Run in terminal: `export GH_TOKEN=<token>`

NEVER run `gh auth` commands yourself.

## PR Information

```bash
# View PR details
gh pr view <number>

# View PR comments
gh pr view <number> --comments

# List PR files
gh pr diff <number> --stat

# View PR diff
gh pr diff <number>

# List open PRs
gh pr list
```

## Review Comments

```bash
# Fetch review comments on a PR
gh api repos/{owner}/{repo}/pulls/{number}/comments

# Fetch review summaries
gh api repos/{owner}/{repo}/pulls/{number}/reviews

# Filter with jq
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  --jq '.[] | {id: .id, path: .path, body: .body, user: .user.login}'
```

## Issues

```bash
# View an issue
gh issue view <number>

# List open issues
gh issue list

# Search issues
gh issue list --search "keyword"
```

## Repository

```bash
# View repo info
gh repo view

# List branches
gh api repos/{owner}/{repo}/branches --jq '.[].name'

# List recent commits on a branch
gh api repos/{owner}/{repo}/commits?sha=<branch> \
  --jq '.[:10] | .[].commit.message'
```

## General API Access

For any GitHub REST API endpoint, use `gh api`:

```bash
gh api <endpoint> [--jq '<filter>'] [--paginate]
```

Use `--paginate` for endpoints that return paginated results.
Use `--jq` to filter JSON output.

## Rules

- Only use read-only commands (`view`, `list`, `diff`, GET API calls)
- Never use write commands (`create`, `edit`, `close`, `merge`, `delete`)
- Never run `gh auth` commands
- Use `--jq` to keep output concise
