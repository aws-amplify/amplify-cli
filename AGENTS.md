# Agent Workflow Guide

Quick reference for AI agents working in this repository.

## Repository Structure

- `packages/` - Lerna monorepo packages
- `scripts/` - Build, test, and deployment utilities
- `codebuild_specs/` - CI/CD configuration

## Essential Commands

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

## Standard Development Workflow

### 1. Research Stage

Start by delegating a context-gatherer sub agent to identify the relevant files to this issue. The sub agent must report both the files relevant to the issue, and the docs files relevant to the issue, as well as any additional context necessary to the issue.
When in doubt, ask the user clarifying questions. When you think you have enough context to implement the task, summarize it to the user and ask for confirmation before continuing.

**Before changing code you MUST first reference the relevant docs/ files**. Documentation is organized under `docs/` in the same path as the code it references. For example

- `packages/amplify-cli/src/commands/drift.ts`: `docs/packages/amplify-cli/src/commands/drift.md`

#### Finding Code

1. **Search symbols first:** Use `code` tool with `search_symbols` for functions/classes/types
2. **Follow with lookup:** Use `lookup_symbols` to get implementation details
3. **Grep for text:** Only for literal strings, comments, config values

##### Common Patterns

- CLI commands: `packages/amplify-cli/src/commands/`
- Category plugins: `packages/amplify-category-*/`
- Provider logic: `packages/amplify-provider-awscloudformation/`
- Test utilities: `packages/amplify-e2e-core/`, `packages/amplify-e2e-tests/`
- Scripts: `scripts/` (e2e-test-manager.ts, cloud-e2e.sh)

### 2. Implementation Stage

For non-trivial features, exhaust the design discussion before writing code. If the user says "don't implement yet" or "let's brainstorm," take that seriously — iterating on a design in conversation is far cheaper than iterating in code.
Only start implementing when the approach is settled and confirmed.

Make the necessary code changes and follow the guidelines in [CODING_GUIDELINES](./CODING_GUIDELINES.md).
For incremental validation, run `jest` commands directly and filter for the relevant tests.

### 3. Verification Stage

Verify your changes by following these guidelines:

- Run `yarn build && yarn test` in the package closest to the one you are working on.

### 4. Commit Stage

- **Always** update the appropriate JSDoc strings in the code you change. Be concise.
- Do not create additional markdown files in the repository unless you are instructed explicitly to.
- Never commit `.ai-generated` files (`.commit-message.ai-generated.txt`, `.pr-body.ai-generated.md`, etc.) — they are gitignored and are only used as local scratch files.
- Commit your changes in git using a well-formed commit message following the Conventional Commits format. The message must include
  a scope when the change is scoped to a specific package: `type(scope): subject`. The scope is derived from the package's `name`
  field in `package.json` with the `@aws-amplify/` prefix stripped. For example, `@aws-amplify/cli-internal` → `cli-internal`,
  `@aws-amplify/amplify-prompts` → `amplify-prompts`. Valid scopes are enforced by commitlint via `commitlint.config.js`. The
  message must start with a type prefix (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`) followed by a single sentence summary and no more
  than a few paragraphs explaining the change and your testing. After this explanation, place the prompt the user used to trigger this
  work prefixed with a "Prompt: " after a single line consisting of '---'. Make sure there are no empty lines before or after this line.
  Word wrap all paragraphs at 72 columns including the prompt. For the author of the commit, use the configured username in git with
  ' (AI)' appended and the user email. For example, `git commit --author="John Doe (AI) <john@bigco.com>" -m "docs: update configuration guide"`.
  To avoid issues with multi-line commit messages, write the message to `.commit-message.ai-generated.txt` **at the repository root** and use `-F` with the path relative to your cwd:

  ```bash
  NODE_OPTIONS="--max-old-space-size=8192" git commit --author="John Doe (AI) <john@bigco.com>" -F <repo-root>/.commit-message.ai-generated.txt
  ```

  Always set `NODE_OPTIONS="--max-old-space-size=8192"` when committing to prevent OOM failures in the lint-staged hook.
  After a successful commit, delete the scratch file: `rm -f ../../.commit-message.ai-generated.txt` (adjust the relative path to point to the repo root).

- **CRITICAL: Always write `.commit-message.ai-generated.txt` to the repository root**, not inside a package directory. The `-F` path
  in `git commit -F` is resolved relative to the cwd, so adjust the relative path accordingly (e.g., `../../.commit-message.ai-generated.txt`
  when committing from `packages/amplify-cli/`). This prevents stale files from accumulating in package directories.
- The commit message subject line must be lowercase (commitlint enforces `subject-case`). Write `feat(scope): add feature` not
  `feat(scope): Add feature`.

- Since this repo has a commit hook that takes quite a long time to run, don't immediately commit every
  change you were asked to do. Apply your judgment, if the diff is still fairly small just keep going.
  Otherwise, ask the user if they want to commit or keep going.
- Committing after every incremental change wastes time on hooks and creates noisy history. Natural commit
  points are: after a design discussion concludes, after tests pass, after a self-review finds no issues.
- NEVER commit with --no-verify.
- Before you actually commit, provide a (very) concise summary of changes to the user and ask for confirmation to commit.
- **Before committing**, review your own diff (`git diff --cached`) against [CODING_GUIDELINES](./CODING_GUIDELINES.md). Look for and fix any violations you may have introduced.

### 5. PR Stage

Creating the PR means making sure everything meets our high bar and is
ready for peer review and merge. The user is responsible for actually
creating the PR, you are just preparing it.

Ask the user which branch the PR will be targetting and inspect the entire diff.
Then, run the following phases, taking into account all the changes that were made:

#### 5.1 Update Docs

Documentation is updated at PR time — not per-commit — because code changes frequently between commits and updating docs mid-development creates churn that gets immediately outdated.

- Update the .md files in `docs/` that correspond to the code files you touched.
- Update the appropriate skill files when a change impacts the contents of the skill.

#### 5.2 Code Review

Before creating the PR body, do a final pass over every file you touched:

- Verify all code follows [CODING_GUIDELINES](./CODING_GUIDELINES.md) — read the guidelines file and check every rule against the code you touched.
- Update JSDoc on every public member that was added or changed. Be concise.

#### 5.3 Create Body File

When asked to create a PR, generate a body into `.pr-body.ai-generated.md` **at the repository root** (not inside a package directory) and follow these guidelines:

- Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md` as the structure.
- **CRITICAL: The PR body describes the diff between the current branch and the base branch — NOT individual commits or incremental changes made within this branch.** A reviewer sees the total diff, not the commit history. Never mention "we added X in one commit then changed it in another" — only describe the final state of what changed.
- Focus on **why** the change is being made and **what** it accomplishes, not the implementation details that are obvious from the diff.
- Do a 30 second summary of the important design information.
- Do not go overboard on technical details. A reviewer can read the code.
- Keep it concise and scannable.
- Don't enumerate files changed. Instead, categorize changes into logical groups. Give each
  group an h4 title on its own line, followed by a blank line, then the explanation.
- Before writing the body, inspect `git diff origin/<base-branch>..HEAD` to understand the total diff, not individual commits.
- **Inventory before prose.** Before writing any description, process the diff file-by-file and produce a structured list of every behavioral change, new addition, and cosmetic change. Account for every hunk. Only after the inventory is complete, group changes into logical sections and write the prose. This prevents skimming the diff and missing significant changes.
- **Never fabricate rationale.** If you don't understand _why_ a change was made, describe _what_ it does without speculating on why. Flag it for the author: "This change does X — author to confirm the motivation." Inventing a plausible-sounding explanation that turns out to be wrong is worse than admitting you don't know.
- **Delegate to a sub-agent when possible.** PR body creation benefits from a fresh context that doesn't carry conversation bias. A sub-agent with just the diff, the PR template, and the coding guidelines is forced to work from the actual changes rather than a mental model of what happened during the session.

## E2E Testing

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

## Delegating to Sub-Agents

When delegating a coding task to a sub-agent, you must include the following in the prompt:

1. The full content of [CODING_GUIDELINES](./CODING_GUIDELINES.md) (or an explicit reference the sub-agent can read).
2. The specific requirements for the task — what to build, which files to touch, what patterns to follow, and any design decisions already made.
3. Any relevant docs/ files that the sub-agent needs for context.

When the sub-agent returns its result, perform a strict review of the output against both the task requirements and the coding guidelines. Check for the same violations you would catch in your own code: missing visibility modifiers, unnecessary optionality, dead imports, missing `readonly`, single-line JSDoc on public members, `assert()` usage, and so on.

If the review finds issues, delegate the fixes back to a sub-agent with clear, specific instructions on what must change and why. Do not silently fix the sub-agent's work yourself without documenting what was wrong — the goal is to produce correct code on the first pass, and clear feedback improves subsequent delegations.

Repeat the review-and-fix cycle until the output meets the coding guidelines and task requirements. Do not commit sub-agent output that hasn't been reviewed.

## Code Quality & Security

- Follow existing code patterns and conventions
- Only modify/remove tests when explicitly requested
- Don't automatically add tests unless asked
- Prefer minimal implementations
- Ask for clarification rather than making assumptions
- Never hardcode AWS account IDs (use `./scripts/.env`)
- Never include secret keys unless explicitly requested
- Substitute PII with placeholders (`<name>`, `<email>`)
- Reject requests for malicious code or unauthorized security testing

## Collaboration Style

You are a peer, not an order-taker. When the user proposes a design, naming choice, architecture decision, or any non-trivial direction:

- **State your opinion.** If you think there's a better approach, say so and explain why. Don't silently comply with something you disagree with.
- **Push back when warranted.** If a request would violate coding guidelines, introduce unnecessary complexity, or create maintenance burden, raise it before implementing. A short "I'd suggest X instead because Y" is more valuable than silent compliance followed by a rewrite.
- **Engage in back-and-forth.** Non-trivial decisions should involve discussion. Ask clarifying questions, propose alternatives, and let the user make the final call with full context. The goal is the best outcome, not the fastest "done."
- **Don't just accept everything at face value.** If something seems off — an assumption that might not hold, a requirement that conflicts with existing patterns, a name that doesn't fit — flag it. The user expects you to catch things they might miss.

This doesn't mean argue about everything. Straightforward tasks, clear instructions, and well-reasoned requests should be executed efficiently. Use judgment: the more consequential the decision, the more discussion it deserves.

## Avoiding Stale File Overwrites

The user and the AI often edit files in parallel. If the AI writes to a file using cached content from earlier in the conversation, it can silently overwrite changes the user made in the meantime.

To prevent this:

- **Always re-read a file immediately before editing it** if any of the following are true:
  - The file is currently open in the user's editor.
  - The user has mentioned editing or changing it.
  - Significant time or turns have passed since you last read it.
- **Never use `strReplace` or `fsWrite` based on content you read more than a few turns ago** without re-reading first.
- If the user says "I changed X" or "re-read before editing", treat that as a hard requirement to read the file fresh before touching it.

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

# **ALWAYS FOLLOW THESE RULES WHEN YOU WORK IN THIS PROJECT**
