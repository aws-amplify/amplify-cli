# Rules for AI Assistants

**IF YOU ARE AN AI ASSISTANT YOU MUST FOLLOW THESE RULES**

## Project Context

This is a TypeScript monorepo (Yarn 3 + Lerna) for AWS Amplify CLI Gen1.

## Standard Development Workflow

__Research Stage__

1. Start by delegating a context-gatherer sub agent to identify the relevant files to this issue. The sub agent must report both the files relevant to the issue, and the docs files relevant to the issue, as well as any additional context necessary to the issue.

**Before changing code you MUST first reference the relevant docs/ files** Documentation is organized under `docs/` in the same path as the code it references:
- For example `packages/amplify-cli/src/commands/drift.ts`: `docs/amplify-cli/drift.md`

__Implementation Stage__

2. **CRITICAL: NO 'any' types allowed.** TypeScript strict mode is enforced throughout the project.

3. Use absolute imports for cross-package dependencies (`@aws-amplify/...`) and relative imports within the same package.

__Verification Stage__

4. Always run `yarn build` before testing your changes. (Only ever build with yarn install && yarn build).

5. Skip testing and manual verification, the engineer must do this.

__Commit Stage__

6. **Always** update the appropriate README or design document when you make a change that impacts the contents of these documents.

7. Do not create additional markdown files in the repository unless you are instructed explicitly to.

8. Commit your changes in git using a well-formed commit message consisting of a single sentence summary and no more than a few paragraphs explaining the change and your testing. After this explanation, place the prompt the user used to trigger this work prefixed with a "Prompt: " after a single line consisting of '---'. Make sure there are no empty lines before or after this line. Word wrap all paragraphs at 72 columns including the prompt. For the author of the commit, use the configured username in git with ' (AI)' appended and the user email. For example, `git commit --author="John Doe (AI) <john@bigco.com>"`


**ALWAYS FOLLOW THESE RULES WHEN YOU WORK IN THIS PROJECT**
 