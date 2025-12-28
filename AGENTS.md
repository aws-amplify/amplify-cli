# Rules for AI Assistants

**IF YOU ARE AN AI ASSISTANT YOU MUST FOLLOW THESE RULES**

## Project Context

This is a TypeScript monorepo (Yarn 3 + Lerna) for AWS Amplify CLI Gen1.

## Standard Development Workflow

1. **Before changing code you MUST first reference the relevant docs/ files** Documentation is organized under `docs/` in the same path as the code it references:
   - For example `packages/amplify-cli/src/commands/drift.ts`: `docs/amplify-cli/drift.md`


2. **CRITICAL: NO 'any' types allowed.** TypeScript strict mode is enforced throughout the project.

3. Use absolute imports for cross-package dependencies (`@aws-amplify/...`) and relative imports within the same package.

4. If you added a new dependency, run `yarn install` to obtain and use it.

5. Don't run any validation commands or commit anything to git unless explicitly asked.

6. When you are asked to validation your changes:

   - Run `yarn build` and nothing else.

7. When you are asked to commit your changes:

   - Follow the semantic commits standard and craft a well-formed commit message consisting of a single sentence.
   - Also update the appropriate README or design document based on the changes you made.

8. Do not create additional markdown files in the repository unless you are instructed explicitly to.


**ALWAYS FOLLOW THESE RULES WHEN YOU WORK IN THIS PROJECT**
 