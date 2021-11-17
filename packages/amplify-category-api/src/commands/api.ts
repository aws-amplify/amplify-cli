import { $TSContext, AmplifyCategories } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';

export const name = AmplifyCategories.API;

export const run = async (context: $TSContext) => {
  if (/^win/.test(process.platform)) {
    try {
      const { run } = await import(path.join('.', AmplifyCategories.API, context.parameters.first));
      return run(context);
    } catch (e) {
      printer.error('Command not found');
    }
  }
  const header = `amplify ${AmplifyCategories.API} <subcommands>`;
  const commands = [
    {
      name: 'add',
      description: `Takes you through a CLI flow to add a ${AmplifyCategories.API} resource to your local backend`,
    },
    {
      name: 'push',
      description: `Provisions ${AmplifyCategories.API} cloud resources and its dependencies with the latest local developments`,
    },
    {
      name: 'remove',
      description: `Removes ${AmplifyCategories.API} resource from your local backend which would be removed from the cloud on the next push command`,
    },
    {
      name: 'update',
      description: `Takes you through steps in the CLI to update an ${AmplifyCategories.API} resource`,
    },
    {
      name: 'gql-compile',
      description: 'Compiles your GraphQL schema and generates a corresponding cloudformation template',
    },
    {
      name: 'add-graphql-datasource',
      description: 'Provisions the AppSync resources and its dependencies for the provided Aurora Serverless data source',
    },
    {
      name: 'console',
      description: 'Opens the web console for the selected api service',
    },
    {
      name: 'migrate',
      description: 'Migrates GraphQL schemas to the latest GraphQL transformer version',
    },
    {
      name: 'rebuild',
      description:
        'Removes and recreates all DynamoDB tables backing a GraphQL API. Useful for resetting test data during the development phase of an app',
    },
    {
      name: 'override',
      description: 'Generates overrides file to apply custom modifications to CloudFormation',
    },
  ];

  context.amplify.showHelp(header, commands);

  printer.blankLine();
};
