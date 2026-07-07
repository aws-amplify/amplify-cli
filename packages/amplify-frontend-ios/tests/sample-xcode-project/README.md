This is an example Xcode project with amplify initialized.

It's used for `xcode.integration.test.js`. That test assumes certain directory layout, i.e. Xcode files and amplify backed with codegen outputs.

If you have to re-generate this project follow these steps:

- Purge `sample-xcode-project` directory content.
- Open Xcode and create new project in `sample-xcode-project`, pick defaults.
- Open shell and navigate to `sample-xcode-project`.
- Run `amplify init`, pick `iOS` and `Xcode` as editors
- Add graphql API. `amplify add api` follow wizard pick defaults, i.e. `ToDo` models.
- Run `amplify codegen models`.
- Commit files.
  - Make sure to include `amplifyconfiguration.json` and `awsconfiguration.json`, they're git ignored by default when initializing Amplify backend.
  - Redact credentials if any.

This project is never pushed and does not require valid credentials. We just need valid project files for `amplify-xcode` to work.
