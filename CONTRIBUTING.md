# Bugs

Bug reports and feature suggestions are welcome. When filing a bug, try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The date/commit of the code you're running
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment

# Pull Requests


Pull requests are welcome!

You should open an issue to discuss your pull request, unless it's a trivial change. It's best to ensure that your proposed change would be accepted so that you don't waste your own time. If you would like to implement support for a significant feature that is not yet available, please talk to us beforehand to avoid any duplication of effort. 

Pull requests should generally be opened against **master**.

Only include ***src*** files in your PR. Don't include any build files i.e. dist/. These will be built upon publish to npm and when a release is created on GitHub.

## Git hooks

You will notice the extra actions carried out when you run the `git commit` or `git push` commands on this monorepo, that's because the following git hooks are configured using [husky](https://github.com/typicode/husky/tree/master) (you can see them in the root [package.json](https://github.com/aws-amplify/amplify-cli/blob/master/package.json#L45) file): 

```json
 "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-push": "npm run lint && npm run test-changed",
      "pre-commit": "yarn split-e2e-tests && pretty-quick --staged"
    }
  }
```

### Requirement: 
To ensure those git hooks properly execute, run `yarn` or `npm install` at the root of this monorepo to install the neccessary dev dependency packages.

### "commit-msg" hook:
The "commit-msg" hook ensures the commit message follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) convention, so that proper CHANGELOG.md files and package versions are maintained. 

You can directly enter a properly formatted simple commit message, such as: 

`git commit -m 'docs(cli): correct spelling of CHANGELOG'`

However, to construct a more comprehensive commit message with proper message title, body and footers to describe bug fix or feature implementation, to indicate BREAKING CHANGE, or to reference github issues, you should run the monorepo's `commit` script (`yarn commit` or `npm run commit`). This will run through a series of question shown below

```
? Select the type of change that you're committing: <type of commit (if its a feature, bug fix etc.,>
? What is the scope of this change (e.g. component or file name)? <package name if change is only in one package>
? Write a short, imperative tense description of the change: <short description with length less than 72 char>
? Provide a longer description of the change: (press enter to skip) <long description>
? Are there any breaking changes? Y/N
? Does this change affect any open issues? Y/N
? Add issue references (e.g. "fix #123", "re #123".): <issue number if exists>

```

For the question `What is the scope of this change`, enter the name of the package that received the major codebase changes. Note that the package name under the `packages/amplify-cli` folder is actually `cli`. 

If the git commit directly addressed certain github issues, add the issue references after the `Add issue references` prompt. However, it is NOT required to search through all the github issues to find the ones that might be relevant and reference them in your commit. 

### "pre-commit" hook:
If the codebase changes updated e2e tests in the `amplify-e2e-tests` package, the "pre-commit" hook will run the `split-e2e-tests` script to update the e2e test steps in the configuration file for our CICD workflow. 

The "pre-commit" hook also runs [prettier](https://prettier.io/) on the staged files.

### "pre-push" hook:
The "pre-push" hook runs lint, and unit tests on the changed packages.

## Tests

Please ensure that your change still passes unit tests, and ideally integration/UI tests. It's OK if you're still working on tests at the time that you submit, but be prepared to be asked about them. Wherever possible, pull requests should contain tests as appropriate. Bugfixes should contain tests that exercise the corrected behavior (i.e., the test should fail without the bugfix and pass with it), and new features should be accompanied by tests exercising the feature.

## Code Style

Generally, match the style of the surrounding code. Please ensure your changes don't wildly deviate from those rules. You can run `yarn lint-fix` to identify and automatically fix most style issues.

## Licensing

AWS Amplify CLI is [Apache 2.0](LICENSE)-licensed. Contributions you submit will be released under that license.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
