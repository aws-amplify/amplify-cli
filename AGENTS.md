# Rules for AI Assistants

**IF YOU ARE AN AI ASSISTANT YOU MUST FOLLOW THESE RULES**

## Project Context

This is a TypeScript monorepo (Yarn 3 + Lerna) for AWS Amplify CLI Gen1.

## Standard Development Workflow

1. **Before changing code you MUST first reference the relevant docs/ files** Documentation is organized under `docs/` in the same path as the code it references:
   - For example `packages/amplify-cli/src/commands/drift.ts`: `docs/amplify-cli/drift.md`


2. **Always** update the appropriate README or design document when you make a change that impacts the contents of these documents.

3. Do not create additional markdown files in the repository unless you are instructed explicitly to.

4. Always run `yarn build` before testing your changes. (Only ever build with yarn install && yarn build).

5. Commit your changes in git using a well-formed commit message consisting of a single sentence summary and no more than a few paragraphs explaining the change and your testing. After this explanation, place the prompt the user used to trigger this work prefixed with a "Prompt: " after a single line consisting of '---'. Make sure there are no empty lines before or after this line. Word wrap all paragraphs at 72 columns including the prompt. For the author of the commit, use the configured username in git with ' (AI)' appended and the user email. For example, `git commit --author="John Doe (AI) <john@bigco.com>"`

6. **CRITICAL: NO 'any' types allowed.** TypeScript strict mode is enforced throughout the project.

7. Use absolute imports for cross-package dependencies (`@aws-amplify/...`) and relative imports within the same package.


**ALWAYS FOLLOW THESE RULES WHEN YOU WORK IN THIS PROJECT**
 