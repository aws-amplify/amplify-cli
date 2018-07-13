# AWS Amplify CLI

To setup your local dev environment:

- under dir `aws-amplify-staging/`<br />
  execute `npm run setup-dev`
<br />

To test your category: 
- `cd <your test frontend project>`
- `amplify init` 
- `amplify <your category> <subcommand>` 

About aws credentials and configurations

- For general configurations, the cli directly uses what the aws sdk provides. The aws sdk uses EC2 role, environmental variables and the shared config files in the directory ~/.aws/ folder, to get credentials. So no additional secrets are stored by the cli.
- If the user does not provide project specific configurations, the cli will use the general configurations for aws access.
- If the user configured project specific configurations, they override the general configurations when cli commands are executed inside the project.
- For project specific configurations, the cli stores the keys in a file (per project) in the ~/.amplify/ folder. Since it's not in the project's codebase, the file won't be accidentally checked into code repos.

Before pushing code or sending PR:
- run npm run lint at the top level directory. This invokes lerna to check for lint errors in all our packages
- eslint can fix some of the lint errors, so go into the package which has errors and run 'lint-fx'
- You might stil have some lint errors which you would have to resolve manually
- Linting your code would make sure of good code quality and practices. So please make sure to do it :)

# Amplify CLI 

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

The Amplify CLI, provides a command line interface for frontend developers to seamlessly enable and configure AWS services into their apps and manage their backend resources with the help of AWS Cloudformation templates.

* [Installation](#installation)
* [Getting Started](#getting-started)
* [Configuration](#configuration)
* [Commands Summary](#commands-summary)
* [Usage](#usage)


## Installation

The easiest way to install is using npm or yarn

```
npm install -g amplify-cli

or

yarn global add amplify-cli
```

## Getting Started

To create a new Amplify project and pull the project configuration into your app, run the following command on your terminal.

```
cd <your-app>
amplify init
```

Running this command enables your Amplify project with cloud resuorces required to provision and deploy your project. By default the Amplify CLI uses AWS Cloudformation as the cloud provider. The command also adds the [AWS Amplify](https://github.com/aws/aws-amplify#aws-amplify) JavaScript library to your app so you can easily integrate Analytics, as well as other features provided by AWS. These features can easily be added  using the amplify cli commands below.


## Configuration

* [Sign up for the AWS Free Tier](https://aws.amazon.com/free/) to learn and prototype at little or no cost.

* Configure the CLI with your AWS credentials

```
amplify configure
```

Check [here](#amplify-configure) for more details about configuration

## Commands Summary

The current set of commands supported by the amplify CLI are

| Command              | Description |
| --- | --- |
| amplify init | Initializes a new project, sets up deployment resources in the cloud and makes your project Amplify ready|
| amplify configure | Configures the aws access credentials, aws region and attributes of your project like switching frontend framework and adding/removing cloud-provider plugins for amplify-cli |
| amplify push | Provisions cloud resources with the latest local developments |
| amplify publish | Executes amplify push, then builds and publishes client-side application to S3 and Cloud Front |
| amplify serve | Executes amplify push, then executes the project's start command to test run the client-side application |
| amplify status | Shows state of local resources not yet pushed to the cloud (Create/Update/Delete) |
| amplify delete | Deletes all the resources tied to the project from the cloud |
| amplify help | Displays help for the core cli |
| amplify <category> help | Displays help for the categories in the cli |

Category specific commands
1. [auth (Cognito)](packages/amplify-category-auth/Readme.md)
2. [storage (S3 & DynamoDB)](packages/amplify-category-storage/Readme.md)
3. [function (Lambda)](packages/amplify-category-function/Readme.md)
4. [api (AppSync & API Gateway)](packages/amplify-category-api/Readme.md)
5. [analytics (Pinpoint)](packages/amplify-category-analytics/Readme.md)
6. [hosting (S3 and CloudFront Distribution)](packages/amplify-category-hosting/Readme.md)

## amplify configure

```
amplify configure
```

#### There are two levels in the aws credential and region configurations for the amplify-cli
- general
- per project

When you run `amplify configure` outside of a valid Amplify project, it sets the general configuration. The general configuration is applied when you run `amplify init` command. And its values are copied as the initial per project configuration for the newly initialized project

When you run `amplify configure` inside a valid Amplify project, it sets the configuration for this project only. It does NOT change the general configuration or the configuration of other projects.

