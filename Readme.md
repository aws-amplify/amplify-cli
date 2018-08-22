# AWS Amplify CLI 

<a href="https://nodei.co/npm/awsmobile-cli/">
  <img src="https://nodei.co/npm/awsmobile-cli.svg?downloads=true&downloadRank=true&stars=true">
</a>

<p>
  <a href="https://travis-ci.org/aws/awsmobile-cli">
    <img src="https://travis-ci.org/aws/awsmobile-cli.svg?branch=master" alt="build:started">
  </a>

  <a href="https://codecov.io/gh/aws/awsmobile-cli">
    <img src="https://codecov.io/gh/aws/awsmobile-cli/branch/master/graph/badge.svg" />
  </a>
</p>

The Amplify CLI, provides a command line interface that front-end developers can use to seamlessly enable and configure AWS services in their apps. It also enables them to manage their backend resources using AWS CloudFormation templates.

* [Installation](#installation)
* [Getting Started](#getting-started)
* [Configuration](#configuration)
* [Commands Summary](#commands-summary)


## Installation

To install the Amplify CLI, use npm or yarn as follows:

```
npm install -g amplify-cli
```

Or

```
yarn global add amplify-cli
```

## Getting Started

To create a new Amplify project and pull the project configuration into your app, run the following command on your terminal:

```
cd <your-app>
amplify init
```

By running this command, you enable your Amplify project with the cloud resources required to provision and deploy your project. By default the Amplify CLI uses AWS CloudFormation as the cloud provider. The command also adds the [AWS Amplify](https://github.com/aws/aws-amplify#aws-amplify) JavaScript library to your app so you can easily integrate analytics and other services provided by AWS. You can add these services using the Amplify CLI commands listed in the following section.



## Commands Summary

The Amplify CLI supports the commands shown in the following table. 

| Command              | Description |
| --- | --- |
| amplify init | Initializes a new project, sets up deployment resources in the cloud and prepares your project for Amplify.|
| amplify configure project | Configures the AWS user profile tied to the project and allows to update configurations set during the amplify init step. |
| amplify push | Provisions cloud resources with the latest local developments. |
| amplify publish | Runs `amplify push`, and then builds and publishes a client-side application to Amazon S3 and Amazon CloudFront (if hosting is enabled). |
| amplify serve | Runs `amplify push`, and then executes the project's start command to test run the client-side application. |
| amplify status | Displays the state of local resources that haven't been pushed to the cloud (Create/Update/Delete). |
| amplify delete | Deletes all of the resources tied to the project from the cloud. |
| amplify help | Displays help for the core CLI. |
| amplify `<category>` help | Displays help for the categories in the CLI. |
| amplify configure | Configures the AWS access credentials, AWS Region and sets up a new AWS User Profile |

Category specific commands:
1. [auth (Amazon Cognito)](packages/amplify-category-auth/Readme.md)
2. [storage (Amazon S3 & Amazon DynamoDB)](packages/amplify-category-storage/Readme.md)
3. [function (AWS Lambda)](packages/amplify-category-function/Readme.md)
4. [api (AWS AppSync & Amazon API Gateway)](packages/amplify-category-api/Readme.md)
5. [analytics (Amazon Pinpoint)](packages/amplify-category-analytics/Readme.md)
6. [hosting (Amazon S3 and Amazon CloudFront distribution)](packages/amplify-category-hosting/Readme.md)


## New user setup

* [Sign up for the AWS Free Tier](https://aws.amazon.com/free/) to learn and prototype at little or no cost.

* Configure the CLI with your AWS credentials by running:


```
amplify configure
```


# Development setup

To set up your local dev environment, go to the `aws-amplify-staging/` directory and then run the following:<br>
`yarn config set workspaces-experimental true`<br>
`npm run setup-dev`

To test your category, do the following:<br> 
`cd <your test front-end project>` <br>
`amplify init` <br>
`amplify <your category> <subcommand>`<br> 

About AWS Credentials and Configurations

- For general configurations, the CLI directly uses the configuration provided by the AWS SDK. To get credentials, the AWS SDK uses the EC2 role, environmental variables, and shared config files in the directory ~/.aws/ folder. No additional credentials are stored by the CLI.
- If you don't provide project-specific configurations, the CLI uses the general configurations for AWS access.
- If you use project-specific configurations, these configurations override the general configurations when CLI commands are run inside the project.
- For project-specific configurations, the CLI stores the keys in a file (per project) in the ~/.amplify/ folder. Because the key file isn't in the project's code base, the file won't be accidentally checked in to code repos.

Before pushing code or sending a pull request, do the following:
- At the command line, `run npm run lint` at the top-level directory. This invokes lerna to check for lint errors in all of our packages.
- You can use `eslint` to fix some of the lint errors. To use it, go to the package that has errors and run `lint-fx`
- If there are any remaining lint errors, resolve them manually. Linting your code is a best practice that ensures good code quality so it's important that you don't skip this step. 
