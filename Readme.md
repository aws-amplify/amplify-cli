# AWS Amplify CLI 

The AWS Amplify CLI is a toolchain which includes a robust feature set for simplifying mobile and web application development. The CLI uses AWS CloudFormation and nested stacks, which allows you to add or modify configurations locally before you push them for execution in your account.

* [Installation](#installation)
* [Getting Started](#getting-started)
* [Commands Summary](#commands-summary)

## Requirements

 - Node.js® version 8.x or later

## Installation

To install the Amplify CLI, use npm or yarn as follows:

```bash
$ npm install -g @aws-amplify/cli
```

or

```bash
$ yarn global add @aws-amplify/cli
```

## Getting Started

Configure your AWS credentials.

```bash
$ amplify configure
```

By running this command you enable your project with cloud resources required to provision and deploy your project. By default the Amplify CLI uses AWS CloudFormation.

## Commands Summary

The Amplify CLI supports the commands shown in the following table. 

| Command              | Description |
| --- | --- |
| amplify configure | Configures the AWS access credentials, AWS Region and sets up a new AWS User Profile |
| amplify init | Initializes a new project, sets up deployment resources in the cloud and prepares your project for Amplify.|
| amplify configure project | Updates configuration settings used to setup the project during the init step |
| amplify add `<category>` | Adds cloud features to your app. |
| amplify update `<category>` | Updates existing cloud features in your app. |
| amplify push \| amplify `<category>` push | Provisions cloud resources with the latest local developments. |
| amplify publish | Runs `amplify push`, publishes a static assets to Amazon S3 and Amazon CloudFront (*hosting category is required). |
| amplify status | Displays the state of local resources that haven't been pushed to the cloud (Create/Update/Delete). |
| amplify serve | Runs `amplify push`, and then executes the project's start command to test run the client-side application. |
| amplify delete | (Experimental Feature) Attempts to delete resources tied to the project. |
| amplify help \| amplify `<category>` help | Displays help for the core CLI. |
| amplify codegen add \| generate | Performs generation of strongly typed objects using a GraphQL schema. |

### Category specific commands:
- [auth (Amazon Cognito)](packages/amplify-category-auth/Readme.md)
- [storage (Amazon S3 & Amazon DynamoDB)](packages/amplify-category-storage/Readme.md)
- [function (AWS Lambda)](packages/amplify-category-function/Readme.md)
- [api (AWS AppSync & Amazon API Gateway)](packages/amplify-category-api/Readme.md)
- [analytics (Amazon Pinpoint)](packages/amplify-category-analytics/Readme.md)
- [hosting (Amazon S3 and Amazon CloudFront distribution)](packages/amplify-category-hosting/Readme.md)
- [notifications (Amazon Pinpoint)](packages/amplify-category-notifications/Readme.md)

# Contributing

To set up your local dev environment, go to the `amplify-cli` directory and then run the following:<br>
`yarn config set workspaces-experimental true`<br>
`npm run setup-dev`

To test your category, do the following:<br> 
`cd <your test front-end project>` <br>
`amplify init` <br>
`amplify <your category> <subcommand>`<br> 

Before pushing code or sending a pull request, do the following:
- At the command line, `run npm run lint` at the top-level directory. This invokes lerna to check for lint errors in all of our packages.
- You can use `eslint` to fix some of the lint errors. To use it, go to the package that has errors and run `lint-fx`
- If there are any remaining lint errors, resolve them manually. Linting your code is a best practice that ensures good code quality so it's important that you don't skip this step. 
