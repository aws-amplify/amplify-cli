# Contributing to Amplify CLI

Thank you for your interest in contributing to our project! 💛

Whether it's a bug report, new feature, correction, or additional documentation, we greatly value feedback and contributions from our community. Please read through these guidelines carefully before submitting a PR or issue and let us know if it's not up-to-date (or even better, submit a PR with your proposed corrections 😉).

- [Getting Started](#getting-started)
  - [Local Environment Setup](#local-environment-setup)
  - [Architecture of the codebase](#architecture-of-the-codebase)
  - [Steps towards contributions](#steps-towards-contributions)
- [Pull Requests](#pull-requests)
- [Bug Reports](#bug-reports)
- [Commits](#commits)
  - [Git Hooks](#git-hooks)
- [Tests](#tests)
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

1. Ensure you have [Node.js](https://nodejs.org/en/download/) installed, which comes bundled with [`npm`](https://github.com/npm/cli). Use it to install or upgrade [`yarn`](https://classic.yarnpkg.com/en/docs/install):

   ```sh
   npm install --global yarn
   ```

   > If you are using Yarn v2, run `yarn set version classic` to change to Yarn Classic.

1. Start by [forking](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the _master_ branch of [amplify-cli](https://github.com/aws-amplify/amplify-cli). Then clone it to your machine to work with it locally using one of the following methods:

   ```sh
   # HTTPS
   git clone https://github.com/[username]/amplify-cli.git

   # SSH
   git clone git@github.com:[username]/amplify-cli.git

   # GitHub CLI
   gh repo clone [username]/amplify-cli
   ```

1. Move into your project folder:

   ```sh
   cd amplify-cli
   ```

1. Then, you can run the `setup-dev` script, which installs dependencies and performs initial configuration:

   ```sh
   # Linux / macOS
   yarn setup-dev

   # Windows
   yarn setup-dev-win
   ```

> NOTE: Make sure to always [sync your fork](https://help.github.com/en/github/collaborating-with-issues-and-pull-requests/syncing-a-fork) with _master_ branch of amplify-cli

### Architecture of the codebase

Amplify CLI is a monorepo built with [Yarn Workspaces](https://yarnpkg.com/features/workspaces) and [Lerna](https://github.com/lerna/lerna). All the categories of Amplify live within the `packages/` directory in the root. Each category inside packages has its own `src/` and `package.json`.

[**Packages inside Amplify CLI Monorepo**](https://github.com/aws-amplify/amplify-cli/tree/master/packages)

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

You should open an issue to discuss your pull request, unless it's a trivial change. It's best to ensure that your proposed change would be accepted so that you don't waste your own time. If you would like to implement support for a significant feature that is not yet available, please talk to us beforehand to avoid any duplication of effort.

Pull requests should generally be opened against **_master_**.

Don't include any build files i.e. `dist/` in your PR. These will be built upon publish to npm and when a release is created on GitHub.

### Steps

1. Go through the [Local Environment Setup](#local-environment-setup)
1. Within your local fork, create a new branch based on the issue you're addressing - e.g. `git checkout -b category-auth/admin-auth-support`
   - Use grouping tokens at the beginning of the branch names. For e.g, if you are working on changes specific to `amplify-category-auth`, then you could start the branch name as `category-auth/...`
   - Use slashes to separate parts of branch names
1. Once your work is committed and you're ready to share, run `yarn test`. Manually test your changes in a sample app with different edge cases and also test across different platforms if possible.
1. Run `yarn lint` to find any linting errors
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

You can directly enter a properly formatted simple commit message, such as:

`git commit -m 'docs(cli): correct spelling of CHANGELOG'`

However, we recommend running the monorepo's commit script (`yarn commit` or `npm run commit`) which provides an interactive way to write well formed commit messages:

```sh
yarn commit
```

It helps in constructing a more comprehensive commit message with proper message title, body and footers to describe bug fix or feature implementation, to indicate BREAKING CHANGE, or to reference github issues. It will run through a series of question shown below:

```
? Select the type of change that you're committing: <type of commit (if its a feature, bug fix etc.,>
? What is the scope of this change (e.g. component or file name)? <package name if change is only in one package>
? Write a short, imperative tense description of the change: <short description with length less than 72 char>
? Provide a longer description of the change: (press enter to skip) <long description>
? Are there any breaking changes? Y/N
? Does this change affect any open issues? Y/N
? Add issue references (e.g. "fix #123", "re #123".): <issue number if exists>
```

While making a commit, for the question `What is the scope of this change`, enter the name of the package that received the major codebase changes. Note that the package name under the `packages/amplify-cli` folder is actually `cli`.

If the git commit directly addressed certain github issues, add the issue references after the `Add issue references` prompt. However, it is NOT required to search through all the github issues to find the ones that might be relevant and reference them in your commit.

### Git Hooks

You will notice the extra actions carried out when you run the `git commit` or `git push` commands on this monorepo, that's because the following git hooks are configured using [husky](https://github.com/typicode/husky/tree/master) (you can see them in the root [package.json](https://github.com/aws-amplify/amplify-cli/blob/1afda97bf93e3a00b2899ebfbf27c50e6f10bac3/package.json#L58) file):

```json
"husky": {
    "hooks": {
        "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
        "pre-push": "yarn build-tests && yarn run lint && yarn run test-changed",
        "pre-commit": "yarn split-e2e-tests && pretty-quick --staged"
    }
}
```

> NOTE: To ensure those git hooks properly execute, run `yarn` or `npm install` at the root of this monorepo to install the necessary dev dependency packages.

#### "commit-msg" hook:

The "commit-msg" hook ensures the commit message follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) convention, so that proper [CHANGELOG.md](https://github.com/aws-amplify/amplify-cli/blob/master/packages/amplify-cli/CHANGELOG.md) files and package versions are maintained.

#### "pre-commit" hook:

If the codebase changes updated e2e tests in the `amplify-e2e-tests` package, the "pre-commit" hook will run the `split-e2e-tests` script to update the e2e test steps in the configuration file for our CICD workflow.

The "pre-commit" hook also runs [prettier](https://prettier.io/) on the staged files.

#### "pre-push" hook:

The "pre-push" hook runs lint, and unit tests on the changed packages.

## Tests

Please ensure that your change still passes unit tests, and ideally integration/UI tests. It's OK if you're still working on tests at the time that you submit, but be prepared to be asked about them. Wherever possible, pull requests should contain tests as appropriate. Bugfixes should contain tests that exercise the corrected behavior (i.e., the test should fail without the bugfix and pass with it), and new features should be accompanied by tests exercising the feature.

To run the test suite:

```bash
yarn test
```

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

1.  Reset master branch to that of origin/master:

    ```sh
    git fetch origin && git checkout --track origin/master -B master
    ```

1.  Then, run the `setup-dev` script:

    ```sh
    # Linux / macOS
    yarn setup-dev

    # Windows
    yarn setup-dev-win
    ```

## Code Style

Generally, match the style of the surrounding code. Please ensure your changes don't wildly deviate from those rules. You can run `yarn lint-fix` to identify and automatically fix most style issues.

## Finding Contributions

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at any [`help-wanted`](https://github.com/aws-amplify/amplify-cli/labels/help-wanted) or [`good first issue`](https://github.com/aws-amplify/amplify-cli/labels/good%20first%20issue) is a great place to start.

You could also contribute by reporting bugs, reproduction of bugs with sample code, documentation and test improvements.

## Community

Join the [Discord Server](https://discord.com/invite/amplify). If it's your first time contributing, checkout the `#first-time-contributor` channel.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact opensource-codeofconduct@amazon.com with any additional questions or comments.

## Security Issue Reporting

If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## Licensing

AWS Amplify CLI is [Apache 2.0](LICENSE)-licensed. Contributions you submit will be released under that license.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
