# Rules for AI Assistants

**IF YOU ARE AN AI ASSISTANT YOU MUST FOLLOW THESE RULES**

## Project Context

This is a TypeScript monorepo (Yarn 3 + Lerna) for AWS Amplify CLI Gen1.

## Standard Development Workflow

### 1. Research Stage

Start by delegating a context-gatherer sub agent to identify the relevant files to this issue. The sub agent must report both the
files relevant to the issue, and the docs files relevant to the issue, as well as any additional context necessary to the issue.
When in doubt, ask the user clarifying questions. When you think you have enough context to implement the task, summarize it to the
user and ask for confirmation before continuing.

**Before changing code you MUST first reference the relevant docs/ files**. Documentation is organized under `docs/` in the
same path as the code it references. For example

- `packages/amplify-cli/src/commands/drift.ts`: `docs/amplify-cli/drift.md`

### 2. Implementation Stage

Make the necessary code changes following these guidelines:

- **CRITICAL: NO 'any' types allowed.** TypeScript strict mode is enforced throughout the project.
- Use absolute imports for cross-package dependencies (`@aws-amplify/...`) and relative imports within the same package.
- For incremental validation, run `jest` commands directly and filter for the relevant tests.

### 3. Verification Stage

Verify your changes by following these guidelines:

- Run `yarn test` in the package closest to the one you are working on.
- No need to run `yarn build`. The unit tests are configured to execute the TypeScript files.

### 4. Commit Stage

- **Always** update the appropriate README or design document when you make a change that impacts the contents of these documents.
- **Always** update the appropriate skill files when you make a change that impacts the contents of the skill (path to docs for example).
- **Always** update the appropriate JSDoc strings in the code you change. Be concise.
- Do not create additional markdown files in the repository unless you are instructed explicitly to.
- Commit your changes in git using a well-formed commit message following the Conventional Commits format. The message must start
  with a type prefix (e.g., `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`) followed by a single sentence summary and no more
  than a few paragraphs explaining the change and your testing. After this explanation, place the prompt the user used to trigger this
  work prefixed with a "Prompt: " after a single line consisting of '---'. Make sure there are no empty lines before or after this line.
  Word wrap all paragraphs at 72 columns including the prompt. For the author of the commit, use the configured username in git with
  ' (AI)' appended and the user email. For example, `git commit --author="John Doe (AI) <john@bigco.com>" -m "docs: update configuration guide"`.
  To avoid issues with multi-line commit messages, use a heredoc:

  ```bash
  git commit --author="John Doe (AI) <john@bigco.com>" -m "$(cat <<'EOF'
  feat(scope): subject line

  Body paragraph.
  ---
  Prompt: the user prompt
  EOF
  )"
  ```

- Since this repo has a commit hook that takes quite a long time to run, don't immediately commit every
  change you were asked to do. Apply your judgment, if the diff is still fairly small just keep going.
  Otherwise, ask the user if they want to commit or keep going.
- Before you actually commit, provide a (very) concise summary of changes to the user and ask for confirmation to commit.

### 5. PR Body

When asked to create a PR body, write it to `.pr-body.ai-generated.md` and follow these guidelines:

- Use the PR template in `.github/PULL_REQUEST_TEMPLATE.md` as the structure.
- Focus on **why** the change is being made and **what** it accomplishes, not the implementation details that are obvious from the diff.
- Do not repeat information that already exists in README files included in the PR — link to them instead.
- Do not go overboard on technical details. A reviewer can read the code.
- Keep it concise and scannable.
