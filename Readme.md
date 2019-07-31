<a href="https://aws-amplify.github.io/" target="_blank">
    <img src="https://s3.amazonaws.com/aws-mobile-hub-images/aws-amplify-logo.png" alt="AWS Amplify" width="550" >
</a>

<p>
  <a href="https://gitter.im/AWS-Amplify/Lobby?utm_source=share-link&utm_medium=link&utm_campaign=share-link" target="_blank">
    <img src="https://badges.gitter.im/aws/aws-amplify.png" alt="Gitter Chat" />
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

* [Install the CLI](#install-the-cli)
* [Commands Summary](#commands-summary)
* [Tutorials](#tutorials)
* [Contributing](#contributing)
* [Start building your app](https://aws-amplify.github.io/docs)


## Install the CLI

 - Requires Node.js® version 8.11.x or later


Install and configure the Amplify CLI as follows:

```bash
$ npm install -g @aws-amplify/cli
$ amplify configure
```

## Commands Summary

The Amplify CLI supports the commands shown in the following table.

| Command              | Description |
| --- | --- |
| amplify configure | Configures the AWS access credentials, AWS Region and sets up a new AWS User Profile |
| amplify init | Initializes a new project, sets up deployment resources in the cloud and prepares your project for Amplify.|
| amplify configure project | Updates configuration settings used to setup the project during the init step. |
| amplify add `<category>` | Adds cloud features to your app. |
| amplify update `<category>` | Updates existing cloud features in your app. |
| amplify push [--no-gql-override]| Provisions cloud resources with the latest local developments. The 'no-gql-override' flag does not automatically compile your annotated GraphQL schema and will override your local AppSync resolvers and templates. |
| amplify publish | Runs `amplify push`, publishes a static assets to Amazon S3 and Amazon CloudFront (*hosting category is required). |
| amplify status | Displays the state of local resources that haven't been pushed to the cloud (Create/Update/Delete). |
| amplify serve | Runs `amplify push`, and then executes the project's start command to test run the client-side application. |
| amplify delete | (Experimental Feature) Attempts to delete resources tied to the project. |
| amplify help \| amplify `<category>` help | Displays help for the core CLI. |
| amplify codegen add \| generate | Performs generation of strongly typed objects using a GraphQL schema. |
| amplify env add \| list \| remove \| get \| pull \| import | See the [multienv docs](https://aws-amplify.github.io/docs/cli/multienv). |

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

- [React & React Native tutorial](https://aws-amplify.github.io/docs/js/react)
- [GraphQL transform tutorial](https://aws-amplify.github.io/docs/js/graphql)
- [Native development with Amplify CLI and AWS AppSync](https://aws-amplify.github.io/docs/cli/codegen)

## Contributing

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
