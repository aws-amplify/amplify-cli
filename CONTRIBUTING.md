# Contributing to Amplify CLI

Thank you for your interest in contributing to our project! 💛

Whether it's a bug report, new feature, correction, or additional documentation, we greatly value feedback and contributions from our community. Please read through these guidelines carefully before submitting a PR or issue and let us know if it's not up-to-date (or even better, submit a PR with your proposed corrections 😉).

- [Contributing to Amplify CLI](#contributing-to-amplify-cli)
  - [Getting Started](#getting-started)
    - [Local Environment Setup](#local-environment-setup)
    - [Architecture of the codebase](#architecture-of-the-codebase)
    - [Steps towards contributions](#steps-towards-contributions)
      - [What's with all the lint errors?](#whats-with-all-the-lint-errors)
  - [Pull Requests](#pull-requests)
    - [Labels](#labels)
    - [Steps](#steps)
  - [Bug Reports](#bug-reports)
  - [Commits](#commits)
    - [Git Hooks](#git-hooks)
      - ["commit-msg" hook:](#commit-msg-hook)
      - ["pre-commit" hook:](#pre-commit-hook)
      - ["pre-push" hook:](#pre-push-hook)
  - [Tests](#tests)
    - [How to Find and Create Unit Tests](#how-to-find-and-create-unit-tests)
    - [Running Unit Tests](#running-unit-tests)
    - [End-To-End Tests](#end-to-end-tests)
    - [Code Coverage](#code-coverage)
    - [Manual Testing](#manual-testing)
  - [Debugging](#debugging)
  - [Code Style](#code-style)
  - [Finding Contributions](#finding-contributions)
  - [Community](#community)
  - [Code of Conduct](#code-of-conduct)
  - [Security Issue Reporting](#security-issue-reporting)
  - [Licensing](#licensing)

## Getting Started

Our work is done directly on Github and PR's are sent to the github repo by core team members and contributors. Everyone undergoes the same review process to get their changes into the repo.

This section should get you running with **Amplify CLI** and get you familiar with the basics of the codebase.

### Local Environment Setup

1. Ensure you have [Node.js 18](https://nodejs.org/en/download/) installed, which comes bundled with [`npm`](https://github.com/npm/cli). Use it to install or upgrade [`yarn`](https://yarnpkg.com/getting-started/install):

   ```sh
   npm install --global yarn
   ```

   > Ensure that `.bin` directory is added to your PATH. For example, add `export PATH="<amplify-cli/.bin>:$PATH"` to your shell profile file on Linux or macOS.

2. Ensure you have [Java](https://aws.amazon.com/corretto/) installed and `java` command is available in your system. This is required for DynamoDB emulator.

3. Ensure you are using the npm registry, even with yarn by running `yarn config set npmRegistryServer https://registry.npmjs.org`

4. Start by [forking](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the _dev_ branch of [amplify-cli](https://github.com/aws-amplify/amplify-cli). Then clone it to your machine to work with it locally using one of the following methods:

   ```sh
   # HTTPS
   git clone https://github.com/[username]/amplify-cli.git

   # SSH
   git clone git@github.com:[username]/amplify-cli.git

   # GitHub CLI
   gh repo clone [username]/amplify-cli
   ```

5. Move into your project folder:

   ```sh
   cd amplify-cli
   ```

6. Then, you can run the `setup-dev` script, which installs dependencies and performs initial configuration:

   ```sh
   # Linux / macOS
   yarn && yarn setup-dev

   # Windows
   yarn && yarn setup-dev-win
   ## Preferably run in Git Bash
   ```

   ### Additional Instructions for Windows Users:

   Prior to running the `setup-dev` script:

   1. Install the Visual C++ Build Environment by installing Visual Studio Community Edition. When selecting options, only 'Desktop Development for C++' needs to be added.
   2. Open a terminal window/command prompt and run `npm config edit` and add or modify `msvs_version` setting to be your version of Visual Studio (e.g. `msvs_version=22`)
   3. If you run into the build error 'MSB8040: Spectre-mitigated libraries are required for this project' open the Visual Studio installer, press the 'Modify' button for your version of Visual Studio, then navigate to the 'Individual Components' and search for 'Spectre'. Install options that look like "MSVC v143 - VS 2022 C++ x64/x86 Spectre-mitigated libs (Latest)", you should only need the x86-64 version, but can optionally install versions for ARM and ARM64/ARM64EC.
   4. Go back to the terminal window/command prompt and navigate to the 'amplify-cli' folder and run `yarn clean cache --all`
   5. You should now be ready to run the `setup-dev` script

> NOTE: Make sure to always [sync your fork](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork) with _dev_ branch of amplify-cli

### Architecture of the codebase

Amplify CLI is a monorepo built with [Yarn Workspaces](https://yarnpkg.com/features/workspaces) and [Lerna](https://github.com/lerna/lerna). All the categories of Amplify live within the `packages/` directory in the root. Each category inside packages has its own `src/` and `package.json`.

[**Packages inside Amplify CLI Monorepo**](https://github.com/aws-amplify/amplify-cli/tree/dev/packages)

### Steps towards contributions

- To make changes with respect to a specific category, go into `packages/[category]`.
- Make changes to required file.
- Write unit tests
- Yarn build
- Run test suite
- Test in sample app using [amplify-dev](#tests)
- Submit a PR

## Pull Requests

Pull requests are welcome!

You should open an issue to discuss your pull request, unless it's a trivial change. It's best to ensure that your proposed change would be accepted so that you don't waste your own time. If you would like to implement support for a significant feature that is not yet available, please talk to us beforehand to avoid any duplication of effort. Additionally, please be mindful of the length of the pull request - if your change requires more than 12 file changes, consider breaking the change down into smaller, non-dependent changes. This includes any changes that may be added as a result of the linter.

Pull requests should be opened against **_dev_**.

Don't include any build files i.e. `dist/` in your PR. These will be built upon publish to npm and when a release is created on GitHub.

### Labels

If the change is a breaking change ([as defined by semantic versioning](https://semver.org/)), please add the `semver-major` label to your pull request on GiHub.

### Steps

1. Go through the [Local Environment Setup](#local-environment-setup)
1. Within your local fork, create a new branch based on the issue you're addressing - e.g. `git checkout -b category-auth/admin-auth-support`
   - Use grouping tokens at the beginning of the branch names. For e.g, if you are working on changes specific to `amplify-category-auth`, then you could start the branch name as `category-auth/...`
   - Use slashes to separate parts of branch names
1. Before your first commit, install [git-secrets plugin](https://github.com/awslabs/git-secrets#installing-git-secrets)
1. Once your work is committed and you're ready to share, run `yarn test`. Manually test your changes in a sample app with different edge cases and also test across different platforms if possible.
1. Run `yarn lint-fix` to find and fix any linting errors
1. Run `yarn prettier-changes` to fix styling issues
1. Then, push your branch: `git push origin HEAD` (pushes the current branch to origin remote)
1. Open GitHub to create a PR from your newly published branch. Fill out the PR template and submit a PR.
1. Finally, the Amplify CLI team will review your PR. Add reviewers based on the core member who is tracking the issue with you or code owners. _In the meantime, address any automated check that fail (such as linting, unit tests, etc. in CI)_

## Bug Reports

Bug reports and feature suggestions are always welcome. Good bug reports are extremely helpful, so thanks in advance!

When filing a bug, please try to be as detailed as possible. In addition to the bug report form information, details like these are incredibly useful:

- A reproducible test case or series of steps
- The date/commit/version(s) of the code you're running
- Any modifications you've made relevant to the bug
- Anything unusual about your environment or deployment

Guidelines for bug reports:

- Check to see if a [duplicate or closed issue](https://github.com/aws-amplify/amplify-cli/issues?q=is%3Aissue+) already exists!
- Provide a short and descriptive issue title
- Remove any sensitive data from your examples or snippets
- Format any code snippets using [Markdown](https://docs.github.com/en/github/writing-on-github/creating-and-highlighting-code-blocks) syntax
- If you're not using the latest version of the CLI, see if the issue still persists after upgrading - this helps to isolate regressions!

Finally, thank you for taking the time to read this, and taking the time to write a good bug report.

## Commits

Commit messages should follow the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) specification. For example:

`git commit -m 'docs(cli): correct spelling of CHANGELOG'`

Valid commit types are as follows:

- `build`
- `chore`
- `ci`
- `docs`
- `feat`
- `fix`
- `perf`
- `refactor`
- `style`
- `test`

### Git Hooks

You will notice the extra actions carried out when you run the `git commit` or `git push` commands on this monorepo, that's because the following git hooks are configured using [husky](https://github.com/typicode/husky/tree/main) (you can see them in [.husky](.husky) file):

> NOTE: To ensure those git hooks properly execute, run `yarn` or `npm install` at the root of this monorepo to install the necessary dev dependency packages.

#### "commit-msg" hook:

The "commit-msg" hook ensures the commit message follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) convention, so that proper [CHANGELOG.md](https://github.com/aws-amplify/amplify-cli/blob/dev/packages/amplify-cli/CHANGELOG.md) files and package versions are maintained.

#### "pre-commit" hook:

The "pre-commit" hook runs the [verify-commit](https://github.com/aws-amplify/amplify-cli/blob/dev/scripts/verify-commit.ts) script and runs eslint of changed files.

#### "pre-push" hook:

The "pre-push" hook will build test files and run the `split-e2e-tests` script to ensure the correct configuration file is generated for our CI/CD workflow.

## Tests

Please ensure that your change still passes unit tests. It's OK if you're still working on tests at the time that you submit, but be prepared to be asked about them. Pull requests should contain tests as appropriate. Bugfixes should contain tests that exercise the corrected behavior (i.e., the test should fail without the bugfix and pass with it), and new features should be accompanied by tests exercising the feature.

### How to Find and Create Unit Tests

Unit tests should be located under `.../src/__tests__/` with the expectation that the directory tree under `__tests__` mirrors that of `src`. In general it is expected that unit tests take the name of the file they test. For example:

File:

`amplify-category-function/src/provider-utils/service-walkthroughs/execPermissionsWalkthough.ts`

Unit Tests:

`amplify-category-function/src/__tests__/provider-utils/service-walkthroughs/execPermissionsWalkthrough.test.ts`

### Running Unit Tests

To run the test suite:

```bash
yarn test
```

Or, to run the tests for a specific package,

```bash
cd packages/amplify-category-function
yarn test
```

A preferred workflow is to watch tests while writing code.
For example, you can open a terminal in the directory of the package you are updating
and watch tests in that package.

```bash
cd packages/amplify-category-function
yarn test --watch
```

Using the `watch` option, the unit tests will re-run every time a change is made to the code.

Amplify CLI uses Jest for testing. See the [Jest Documentation](https://jestjs.io/docs/getting-started) for more information.

### End-To-End Tests

End-to-end tests can be found in `packages/amplify-e2e-tests`. It is not recommended to run all of these tests at a time but to, instead, run the tests in a single file in order to debug, fix, or update it.

You can run an end to end test with the following:

```bash
cd packages/amplify-e2e-tests
yarn e2e src/__tests__/some_e2e_test.test.ts
```

You can also run a specific test from a file using:

```bash
yarn e2e src/__tests__/some_e2e_test.test.ts -t name-of-test
```

End to end tests generally provision real resources and attempt to tear them down again after the test has run. If tests are interrupted due to manual intervention or some other issue, resources may stick around and require manual removal.

### Code Coverage

Code coverage can be seen by running all tests, `yarn test`, then running `yarn coverage:collect`.
The coverage is collected in the `coverage/` file at the root of the project.

The coverage can be viewed in a browser by opening `coverage/lcov-report/index.html`,
or in IDE tools utilizing `coverage/lcov.info`.

### Manual Testing

To test your category in sample application, do the following:

```sh
cd <your-test-front-end-project>
amplify-dev init
amplify-dev <your-category> <subcommand>
```

## Debugging

Sometimes issues can be solved by doing a clean and fresh build. To start from a clean project state:

1.  Removes ./lib, tsconfig.tsbuildinfo, and node_modules from all packages and run their clean script:

    ```sh
    yarn clean
    ```

1.  Remove all unstaged changes and everything listed in the .gitignore file:

    ```sh
    git clean -fdx
    ```

1.  Reset dev branch to that of origin/dev:

    ```sh
    git fetch origin && git checkout --track origin/dev -B dev
    ```

1.  Then, run the `setup-dev` script:

    ```sh
    # Linux / macOS
    yarn setup-dev

    # Windows
    yarn setup-dev-win
    ```

If you are using Visual Studio Code, the built-in Javascript Debug Terminal is useful for performing runtime debugging.

In order to use the terminal, build the application. Then, execute the built binary, `amplify-dev`, from the Javascript Debug Terminal. See [VSCode's documentation](https://code.visualstudio.com/docs/nodejs/nodejs-debugging#_javascript-debug-terminal)
for more information.

## Code Style

Generally, match the style of the surrounding code. Please ensure your changes don't wildly deviate from those rules. You can run `yarn lint-fix` to identify and automatically fix most style issues.

## Finding Contributions

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any [`help-wanted`](https://github.com/aws-amplify/amplify-cli/labels/help-wanted) or [`good first issue`](https://github.com/aws-amplify/amplify-cli/labels/good%20first%20issue) is a great place to start.

You could also contribute by reporting bugs, reproduction of bugs with sample code, documentation and test improvements.

## Community

Join the [Discord Server](https://discord.com/invite/amplify). If it's your first time contributing, checkout the [`#contributing`](https://discord.com/channels/705853757799399426/882526909374808084) channel.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact opensource-codeofconduct@amazon.com with any additional questions or comments.

## Security Issue Reporting

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## Licensing

AWS Amplify CLI is [Apache 2.0](LICENSE)-licensed. Contributions you submit will be released under that license.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
