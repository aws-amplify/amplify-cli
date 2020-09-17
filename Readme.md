<a href="https://aws-amplify.github.io/" target="_blank">
    <img src="https://s3.amazonaws.com/aws-mobile-hub-images/aws-amplify-logo.png" alt="AWS Amplify" width="550" >
</a>

<p>
  <a href="https://discord.gg/jWVbPfC" target="_blank">
    <img src="https://img.shields.io/discord/308323056592486420?logo=discord"" alt="Discord Chat" />  
  </a>
  <a href="https://www.npmjs.com/package/@aws-amplify/cli">
    <img src="https://img.shields.io/npm/v/@aws-amplify/cli.svg" />
  </a>
  <a href="https://circleci.com/gh/aws-amplify/amplify-cli">
    <img src="https://img.shields.io/circleci/project/github/aws-amplify/amplify-cli/master.svg" alt="build:started">
  </a>
</p>

# AWS Amplify CLI

The AWS Amplify CLI is a toolchain which includes a robust feature set for simplifying mobile and web application development. The CLI uses AWS CloudFormation and nested stacks to allow you to add or modify configurations locally before you push them for execution in your account.

- [Install the CLI](#install-the-cli)
- [Commands Summary](#commands-summary)
- [Tutorials](#tutorials)
- [Contributing](#contributing)
- [Start building your app](https://aws-amplify.github.io/docs)
- [Changelog](https://github.com/aws-amplify/amplify-cli/blob/master/packages/amplify-cli/CHANGELOG.md)

## Install the CLI

- Requires Node.js® version 10 or later

Install and configure the Amplify CLI as follows:

```bash
$ npm install -g @aws-amplify/cli
$ amplify configure
```

**_Note_**: If you're having permission issues on your system installing the CLI, please try the following command:

```bash
$ sudo npm install -g @aws-amplify/cli --unsafe-perm=true
$ amplify configure
```

## Commands Summary

The Amplify CLI supports the commands shown in the following table.

| Command                                                                | Description                                                                                                                                                                                                          |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| amplify configure                                                      | Configures the AWS access credentials, AWS Region and sets up a new AWS User Profile                                                                                                                                 |
| amplify init                                                           | Initializes a new project, sets up deployment resources in the cloud and prepares your project for Amplify.                                                                                                          |
| amplify configure project                                              | Updates configuration settings used to setup the project during the init step.                                                                                                                                       |
| amplify add `<category>`                                               | Adds cloud features to your app.                                                                                                                                                                                     |
| amplify update `<category>`                                            | Updates existing cloud features in your app.                                                                                                                                                                         |
| amplify push [--no-gql-override]                                       | Provisions cloud resources with the latest local developments. The 'no-gql-override' flag does not automatically compile your annotated GraphQL schema and will override your local AppSync resolvers and templates. |
| amplify pull                                                           | Fetch upstream backend environment definition changes from the cloud and updates the local environment to match that definition.                                                                                     |
| amplify publish                                                        | Runs `amplify push`, publishes a static assets to Amazon S3 and Amazon CloudFront (\*hosting category is required).                                                                                                  |
| amplify status                                                         | Displays the state of local resources that haven't been pushed to the cloud (Create/Update/Delete).                                                                                                                  |
| amplify serve                                                          | Runs `amplify push`, and then executes the project's start command to test run the client-side application.                                                                                                          |
| amplify delete                                                         | Deletes resources tied to the project.                                                                                                                                                                               |
| amplify help \| amplify `<category>` help                              | Displays help for the core CLI.                                                                                                                                                                                      |
| amplify codegen add \| generate                                        | Performs generation of strongly typed objects using a GraphQL schema.                                                                                                                                                |
| amplify env add \| list \| remove \| get \| pull \| import \| checkout | See the [multienv docs](https://docs.amplify.aws/cli/teams/overview).                                                                                                                                                |

### Category specific commands:

- [auth (Amazon Cognito)](packages/amplify-category-auth/Readme.md)
- [storage (Amazon S3 & Amazon DynamoDB)](packages/amplify-category-storage/Readme.md)
- [function (AWS Lambda)](packages/amplify-category-function/Readme.md)
- [api (AWS AppSync & Amazon API Gateway)](packages/amplify-category-api/Readme.md)
- [analytics (Amazon Pinpoint)](packages/amplify-category-analytics/Readme.md)
- [hosting (Amazon S3 and Amazon CloudFront distribution)](packages/amplify-category-hosting/Readme.md)
- [notifications (Amazon Pinpoint)](packages/amplify-category-notifications/Readme.md)
- [interactions (Amazon Lex)](packages/amplify-category-interactions/Readme.md)
- [predictions (Amazon Rekognition, Amazon Textract, Amazon Translate, Amazon Polly, Amazon Transcribe, Amazon Comprehend, and Amazon SageMaker)](packages/amplify-category-predictions/Readme.md)

## Tutorials

- [Getting Started guide](https://docs.amplify.aws/start)
- [GraphQL transform tutorial](https://docs.amplify.aws/cli/graphql-transformer/overview)
- [Native development with Amplify CLI and AWS AppSync](https://docs.amplify.aws/cli/graphql-transformer/codegen)

## Developing

To set up your local dev environment, go to the `amplify-cli` directory and then run the following:<br>
`yarn config set workspaces-experimental true`<br>
`npm run setup-dev`

To test your category, do the following:<br>
`cd <your test front-end project>` <br>
`amplify-dev init` <br>
`amplify-dev <your category> <subcommand>`<br>

Before pushing code or sending a pull request, do the following:

- At the command line, run `npm run lint` at the top-level directory. This invokes lerna to check for lint errors in all of our packages.
- You can use `eslint` to fix some of the lint errors. To use it, go to the package that has errors and run `lint-fix`
- If there are any remaining lint errors, resolve them manually. Linting your code is a best practice that ensures good code quality so it's important that you don't skip this step.

## Contributing

See the contribution guideline. https://github.com/aws-amplify/amplify-cli/blob/master/CONTRIBUTING.md
