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

Before submitting PR make sure to run `yarn` on the root of monorepo to ensure that commit lint and husky are installed.

Make sure you follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/) commit message structure. You can automatically generate conventional commit message by running `yarn commit` in the root of the amplify mono repo. This will run through series of question shown below
```
? Select the type of change that you're committing: <type of commit (if its a feature, bug fix etc.,>
? What is the scope of this change (e.g. component or file name)? <package name if change is only in one package>
? Write a short, imperative tense description of the change: <short description with length less than 72 char>
? Provide a longer description of the change: (press enter to skip) <long description>
? Are there any breaking changes? Y/N
? Does this change affect any open issues? Y/N
? Add issue references (e.g. "fix #123", "re #123".): <issue number if exists>

```

## Tests

Please ensure that your change still passes unit tests, and ideally integration/UI tests. It's OK if you're still working on tests at the time that you submit, but be prepared to be asked about them. Wherever possible, pull requests should contain tests as appropriate. Bugfixes should contain tests that exercise the corrected behavior (i.e., the test should fail without the bugfix and pass with it), and new features should be accompanied by tests exercising the feature.

## Code Style

Generally, match the style of the surrounding code. Please ensure your changes don't wildly deviate from those rules. You can run `yarn lint-fix` to identify and automatically fix most style issues.

## Licensing

AWS Amplify CLI is [Apache 2.0](LICENSE)-licensed. Contributions you submit will be released under that license.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.
