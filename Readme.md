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
</p>

### Reporting Bugs/Feature Requests

[![Open Bugs](https://img.shields.io/github/issues/aws-amplify/amplify-cli/bug?color=d73a4a&label=bugs)](https://github.com/aws-amplify/amplify-cli/issues?q=is%3Aissue+is%3Aopen+label%3Abug)
[![Feature Requests](https://img.shields.io/github/issues/aws-amplify/amplify-cli/feature-request?color=ff9001&label=feature%20requests)](https://github.com/aws-amplify/amplify-cli/issues?q=is%3Aissue+label%3Afeature-request+is%3Aopen)
[![Closed Issues](https://img.shields.io/github/issues-closed/aws-amplify/amplify-cli?color=%2325CC00&label=issues%20closed)](https://github.com/aws-amplify/amplify-cli/issues?q=is%3Aissue+is%3Aclosed+)

> [!Important]
>
> # Amplify Gen 2 is now generally available
>
> If you are starting a new project, we recommend starting with [Amplify Gen 2](https://github.com/aws-amplify/amplify-backend).
>
> If you are an existing Gen 1 customer, we encourage you to start planning your migration to Gen 2 by
> testing the [beta version of our migration tool](https://github.com/aws-amplify/amplify-cli/discussions/14490)
> on **non-production** environments. We remain committed to supporting both Gen 1 and Gen 2 for the foreseeable future.

# AWS Amplify CLI (Gen 1)

The AWS Amplify CLI is a toolchain which includes a robust feature set for simplifying mobile and web application development. The CLI uses AWS CloudFormation and nested stacks to allow you to add or modify configurations locally before you push them for execution in your account.

- [Install the CLI](#install-the-cli)
- [Commands Summary](#commands-summary)
- [Tutorials](#tutorials)
- [Contributing](#contributing)
- [Start building your app](https://aws-amplify.github.io/docs)
- [Changelog](https://github.com/aws-amplify/amplify-cli/releases/latest)

## Install the CLI

- Requires Node.js® version 22 or later

Install and configure the Amplify CLI as follows:

```bash
$ npm install -g @aws-amplify/cli
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
| amplify status [ `<category>`...]                                      | Displays the state of local resources that haven't been pushed to the cloud (Create/Update/Delete).                                                                                                                  |
| amplify status -v [ `<category>`...]                                   | Verbose mode - Shows the detailed verbose diff between local and deployed resources, including cloudformation-diff                                                                                                   |
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

To set up your local development environment, go to [Local Environment Setup](https://github.com/aws-amplify/amplify-cli/blob/dev/CONTRIBUTING.md#local-environment-setup).

To test your category, do the following:

```sh
cd <your-test-front-end-project>
amplify-dev init
amplify-dev <your-category> <subcommand>
```

Before pushing code or sending a pull request, do the following:

- At the command line, run `yarn lint` at the top-level directory. This invokes eslint to check for lint errors in all of our packages.
- You can use `yarn lint` to find some of the lint errors. To attempt fix them, go to the package that has errors and run `yarn lint-fix`
- If there are any remaining lint errors, resolve them manually. Linting your code is a best practice that ensures good code quality so it's important that you don't skip this step.

## Contributing

We are thankful for any contributions from the community. Look at our [Contribution Guidelines](https://github.com/aws-amplify/amplify-cli/blob/dev/CONTRIBUTING.md).
