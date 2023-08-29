import { CommandInfo } from './help-helpers';

export const commandsInfo: Array<CommandInfo> = [
  {
    command: 'init',
    commandDescription: 'Initialize a new Amplify project',
    commandUsage:
      'amplify init [-y | --yes] [--amplify <payload>] [--envName <env-name>] [--debug] [--frontend <payload>] [--providers <payload>] [--categories <payload>] [--app <git-url>] [--permissions-boundary <ARN>]',
    commandFlags: [
      {
        short: 'y',
        long: 'yes',
        flagDescription: 'Skip all interactive prompts by selecting default options',
      },
      {
        short: '',
        long: 'amplify',
        flagDescription: 'Basic information of the project',
      },
      {
        short: '',
        long: 'frontend',
        flagDescription: "Information for the project's frontend application",
      },
      {
        short: '',
        long: 'envName',
        flagDescription: 'Name of the environment for the Amplify project',
      },
      {
        short: '',
        long: 'debug',
        flagDescription: 'Run the CLI in debug mode',
      },
      {
        short: '',
        long: 'providers',
        flagDescription: 'Configuration settings for provider plugins',
      },
      {
        short: '',
        long: 'categories',
        flagDescription: 'Configuration settings for resources in the given categories',
      },
      {
        short: '',
        long: 'app',
        flagDescription: 'Specify a GitHub repository from which to create an Amplify project',
      },
      {
        short: '',
        long: 'permissions-boundary <ARN>',
        flagDescription: 'Specify an IAM permissions boundary for the roles created during init',
      },
    ],
    subCommands: [],
  },
  {
    command: 'configure',
    commandDescription: 'Configure the CLI to work with your AWS profile',
    commandUsage: 'amplify configure [subcommand]',
    commandFlags: [
      { short: '', long: 'usage-data-on', flagDescription: 'Turn on usage data sharing.' },
      { short: '', long: 'usage-data-off', flagDescription: 'Turn off usage data sharing.' },
      { short: '', long: 'share-project-config-on', flagDescription: 'Turn on non-sensitive project configurations sharing on failures.' },
      {
        short: '',
        long: 'share-project-config-off',
        flagDescription: 'Turn off non-sensitive project configurations sharing on failures.',
      },
    ],
    subCommands: [
      {
        subCommand: 'project',
        subCommandDescription: 'Configure the attributes of your project',
        subCommandUsage:
          'amplify configure project [-y | --yes] [--debug] [--amplify <payload>] [--frontend <payload>] [--providers <payload>]',
        subCommandFlags: [
          {
            short: 'y',
            long: 'yes',
            flagDescription: 'Skip all interactive prompts by selecting default options',
          },
          {
            short: '',
            long: 'debug',
            flagDescription: 'Run the CLI in debug mode',
          },
          {
            short: '',
            long: 'amplify',
            flagDescription: 'Basic information of the project',
          },
          {
            short: '',
            long: 'frontend',
            flagDescription: "Information for the project's frontend application",
          },
          {
            short: '',
            long: 'providers',
            flagDescription: 'Configuration settings for provider plugins',
          },
        ],
      },
      {
        subCommand: 'hosting',
        subCommandDescription: 'Configure hosting resources for your Amplify project',
        subCommandUsage: 'amplify configure hosting',
        subCommandFlags: [],
      },
      {
        subCommand: 'codegen',
        subCommandDescription: 'Configure GraphQL codegen for your Amplify project',
        subCommandUsage: 'amplify configure codegen',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'push',
    commandDescription: 'Provisions cloud resources with the latest local changes',
    commandUsage: 'amplify push [category] [--codegen] [--debug] [-f | --force] [-y | --yes] [--allow-destructive-graphql-schema-updates]',
    commandFlags: [
      {
        short: '',
        long: 'codegen',
        flagDescription: 'Configuration for GraphQL codegen',
      },
      {
        short: '',
        long: 'debug',
        flagDescription: 'Run the CLI in debug mode',
      },
      {
        short: 'f',
        long: 'force',
        flagDescription: 'Pushes all resources regardless of update status and bypasses all guardrails',
      },
      {
        short: 'y',
        long: 'yes',
        flagDescription: 'Skip all interactive prompts by selecting default options',
      },
      {
        short: '',
        long: 'allow-destructive-graphql-schema-updates',
        flagDescription: 'Pushes schema changes that require removal or replacement of underlying tables',
      },
    ],
    subCommands: [
      {
        subCommand: '[category]',
        subCommandDescription: 'Provisions cloud resources with the latest local changes for a single category',
        subCommandUsage: 'amplify push [category] [--codegen] [-f | --force] [-y | --yes] [--allow-destructive-graphql-schema-updates]',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'pull',
    commandDescription: 'Fetch upstream backend changes from the cloud and updates the local environment',
    commandUsage:
      'amplify pull [--appId <app-id>] [--envName <env-name>] [--debug] [-y | --yes] [--restore] [--amplify <payload>] [--frontend <payload>] [--providers <payload>] [--categories <payload>]',
    commandFlags: [
      {
        short: '',
        long: 'appId <app-id>',
        flagDescription: 'The unique identifier for the Amplify project',
      },
      {
        short: '',
        long: 'envName <env-name>',
        flagDescription: 'Name of the environment for the Amplify project',
      },
      {
        short: '',
        long: 'debug',
        flagDescription: 'Run the CLI in debug mode',
      },
      {
        short: 'y',
        long: 'yes',
        flagDescription: 'Skip all interactive prompts by selecting default options',
      },
      {
        short: '',
        long: 'restore',
        flagDescription: 'Overwrite your local backend changes with configurations from the cloud',
      },
      {
        short: '',
        long: 'amplify',
        flagDescription: 'Basic information of the project',
      },
      {
        short: '',
        long: 'frontend',
        flagDescription: "Information for the project's frontend application",
      },
      {
        short: '',
        long: 'providers',
        flagDescription: 'Configuration settings for provider plugins',
      },
    ],
    subCommands: [],
  },
  {
    command: 'env',
    commandDescription: 'Displays and manages environment related information for your Amplify project',
    commandUsage: 'amplify env <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Adds a new environment to your Amplify Project',
        subCommandUsage: 'amplify env add [env-name] [-y | --yes] [--envName <env-name>]',
        subCommandFlags: [
          {
            short: 'y',
            long: 'yes',
            flagDescription: 'Skip all interactive prompts by selecting default options',
          },
          {
            short: '',
            long: 'envName <env-name>',
            flagDescription: 'Specify environment name',
          },
        ],
      },
      {
        subCommand: 'checkout <env-name>',
        subCommandDescription: 'Moves your environment to the environment specified in the command',
        subCommandUsage: 'amplify env checkout <env-name> [--restore]',
        subCommandFlags: [
          {
            short: '',
            long: 'restore',
            flagDescription: 'Overwrite your local backend with that of the specified environment',
          },
        ],
      },
      {
        subCommand: 'get',
        subCommandDescription: 'Displays and manages environment related information for your Amplify project',
        subCommandUsage: 'amplify env get [--name <env-name>] [--json]',
        subCommandFlags: [
          {
            short: '',
            long: 'name <env-name>',
            flagDescription: 'Specify name',
          },
          {
            short: '',
            long: 'json',
            flagDescription: 'Get environment information in JSON format',
          },
        ],
      },
      {
        subCommand: 'import',
        subCommandDescription: 'Imports an existing Amplify project environment stack to your local backend',
        subCommandUsage: 'amplify env import [--name <env-name>] [--config <provider-configs>] [--awsInfo <aws-configs>]',
        subCommandFlags: [
          {
            short: '',
            long: 'name <env-name>',
            flagDescription: 'Specify name',
          },
          {
            short: '',
            long: 'config <provider-configs>',
            flagDescription: 'Specify configuration file',
          },
          {
            short: '',
            long: 'awsInfo <aws-configs>',
            flagDescription: 'Specify AWS account info',
          },
        ],
      },
      {
        subCommand: 'list',
        subCommandDescription: 'Displays a list of all the environments in your Amplify project',
        subCommandUsage: 'amplify env list [--details] [--json]',
        subCommandFlags: [
          {
            short: '',
            long: 'details',
            flagDescription: 'List environment details',
          },
          {
            short: '',
            long: 'json',
            flagDescription: 'List environment details in JSON format',
          },
        ],
      },
      {
        subCommand: 'pull',
        subCommandDescription: 'Pulls your environment with the current cloud environment',
        subCommandUsage: 'amplify env pull [-y | --yes] [--restore]',
        subCommandFlags: [
          {
            short: 'y',
            long: 'yes',
            flagDescription: 'Skip all interactive prompts by selecting default options',
          },
          {
            short: '',
            long: 'restore',
            flagDescription: 'Overwrite your local backend with that of the specified environment',
          },
        ],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes an environment from the Amplify project',
        subCommandUsage: 'amplify env remove [env-name] [-y | --yes] [--envName <env-name>]',
        subCommandFlags: [
          {
            short: 'y',
            long: 'yes',
            flagDescription: 'Skip all interactive prompts by selecting default options',
          },
          {
            short: '',
            long: 'envName <env-name>',
            flagDescription: 'Specify environment name',
          },
        ],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Update the environment configuration',
        subCommandUsage: 'amplify env update [--permissions-boundary <IAM Policy ARN>]',
        subCommandFlags: [
          {
            short: '',
            long: 'permissions-boundary <IAM Policy ARN>',
            flagDescription: 'Set a permissions boundary',
          },
        ],
      },
    ],
  },
  {
    command: 'add',
    commandDescription: 'Adds a resource for an Amplify category in your local backend',
    commandUsage: 'amplify add <category>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: '<category>',
        subCommandDescription: 'Adds a resource for an Amplify category in your local backend',
        subCommandUsage: 'amplify add <category> [--headless <payload>] [-y | --yes]',
        subCommandFlags: [
          {
            short: '',
            long: 'headless',
            flagDescription: 'Headless JSON payload',
          },
          {
            short: 'y',
            long: 'yes',
            flagDescription: 'Skip all interactive prompts by selecting default options',
          },
        ],
      },
    ],
  },
  {
    command: 'status',
    commandDescription: 'Shows the state of local resources not yet pushed to the cloud',
    commandUsage: 'amplify status [-v | --verbose]',
    commandFlags: [
      {
        short: 'v',
        long: 'verbose',
        flagDescription: 'Shows verbose details, including cloudformation differences',
      },
    ],
    subCommands: [
      {
        subCommand: 'notifications',
        subCommandDescription: 'Lists the enabled/disabled statuses of the available notification channels',
        subCommandUsage: 'amplify notifications status',
        subCommandFlags: [],
      },
      {
        subCommand: 'api',
        subCommandDescription: 'Displays the current status of your API',
        subCommandUsage: 'amplify api status [-acm <table-name>]',
        subCommandFlags: [
          {
            short: 'acm',
            long: '',
            flagDescription: 'Displays the access control matrix',
          },
        ],
      },
      {
        subCommand: 'auth',
        subCommandDescription: 'Displays the current status of your auth resource',
        subCommandUsage: 'amplify auth status',
        subCommandFlags: [],
      },
      {
        subCommand: 'custom',
        subCommandDescription: 'Displays the current status of your custom resource',
        subCommandUsage: 'amplify custom status',
        subCommandFlags: [],
      },
      {
        subCommand: 'storage',
        subCommandDescription: 'Displays the current status of your storage resource',
        subCommandUsage: 'amplify storage status',
        subCommandFlags: [],
      },
      {
        subCommand: 'analytics',
        subCommandDescription: 'Displays the current status of your analytics resource',
        subCommandUsage: 'amplify analytics status',
        subCommandFlags: [],
      },
      {
        subCommand: 'function',
        subCommandDescription: 'Displays the current status of your function resource',
        subCommandUsage: 'amplify function status',
        subCommandFlags: [],
      },
      {
        subCommand: 'hosting',
        subCommandDescription: 'Displays the current status of your hosting',
        subCommandUsage: 'amplify hosting status',
        subCommandFlags: [],
      },
      {
        subCommand: 'interactions',
        subCommandDescription: 'Displays the current status of your interactions resource',
        subCommandUsage: 'amplify interactions status',
        subCommandFlags: [],
      },
      {
        subCommand: 'predictions',
        subCommandDescription: 'Displays the current status of your predictions resource',
        subCommandUsage: 'amplify predictions status',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'plugin',
    commandDescription: 'Configure Amplify plugins',
    commandUsage: 'amplify plugin <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'init',
        subCommandDescription: 'Scaffolds a skeleton Amplify CLI plugin',
        subCommandUsage: 'amplify plugin init',
        subCommandFlags: [],
      },
      {
        subCommand: 'configure',
        subCommandDescription: 'Configures Amplify CLI plugin options',
        subCommandUsage: 'amplify plugin configure',
        subCommandFlags: [],
      },
      {
        subCommand: 'list',
        subCommandDescription: 'Lists general plugin information',
        subCommandUsage: 'amplify plugin list',
        subCommandFlags: [],
      },
      {
        subCommand: 'scan',
        subCommandDescription: 'Explicitly starts a scan/search for new and existing plugins',
        subCommandUsage: 'amplify plugin scan',
        subCommandFlags: [],
      },
      {
        subCommand: 'add',
        subCommandDescription: 'Explicitly adds a plugin for the Amplify CLI to use',
        subCommandUsage: 'amplify plugin add',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Explicitly removes a plugin from the Amplify CLI',
        subCommandUsage: 'amplify plugin remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'verify',
        subCommandDescription: 'Verifies if a plugin package/directory is a valid Amplify CLI plugin',
        subCommandUsage: 'amplify plugin verify',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'update',
    commandDescription: 'Update resource for an Amplify category in your local backend',
    commandUsage: 'amplify update <category>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: '<category>',
        subCommandDescription: 'Update resource for an Amplify category in your local backend',
        subCommandUsage: 'amplify update <category> [--headless <payload>] [-y | --yes]',
        subCommandFlags: [
          {
            short: '',
            long: 'headless',
            flagDescription: 'Headless JSON payload',
          },
          {
            short: 'y',
            long: 'yes',
            flagDescription: 'Skip all interactive prompts by selecting default options',
          },
        ],
      },
    ],
  },
  {
    command: 'publish',
    commandDescription: 'Executes amplify push and hosts the frontend app',
    commandUsage:
      'amplify publish [-y | --yes] [--codegen] [-f | --force] [--allow-destructive-graphql-schema-updates] [-c | --invalidateCloudFront]',
    commandFlags: [
      {
        short: 'y',
        long: 'yes',
        flagDescription: 'Automatically accept publish prompt',
      },
      {
        short: '',
        long: 'codegen',
        flagDescription: 'Configuration for GraphQL codegen',
      },
      {
        short: 'f',
        long: 'force',
        flagDescription: 'Pushes all resources regardless of update status and bypasses all guardrails',
      },
      {
        short: '',
        long: 'allow-destructive-graphql-schema-updates',
        flagDescription: 'Pushes schema changes that require removal or replacement of underlying tables',
      },
      {
        short: 'c',
        long: 'invalidateCloudFront',
        flagDescription: 'Send an invalidation request to the Amazon CloudFront service',
      },
    ],
    subCommands: [],
  },
  {
    command: 'remove',
    commandDescription: 'Removes a resource for an Amplify category in your local backend',
    commandUsage: 'amplify remove <category>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: '<category>',
        subCommandDescription: 'Removes a resource for an Amplify category in your local backend',
        subCommandUsage: 'amplify remove <category> [--headless <payload>] [-y | --yes]',
        subCommandFlags: [
          {
            short: '',
            long: 'headless',
            flagDescription: 'Headless JSON payload',
          },
        ],
      },
    ],
  },
  {
    command: 'console',
    commandDescription: 'Opens the web console for the selected cloud resource',
    commandUsage: 'amplify console <category>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: '<category>',
        subCommandDescription: 'Removes a resource for an Amplify category in your local backend',
        subCommandUsage: 'amplify console <category>',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'delete',
    commandDescription: 'Delete the Amplify project',
    commandUsage: 'amplify delete [-y | --yes] [-f | --force]',
    commandFlags: [
      {
        short: 'y',
        long: 'yes',
        flagDescription: 'Skip all interactive prompts by selecting default options',
      },
      {
        short: 'f',
        long: 'force',
        flagDescription: 'Skip all interactive prompts by selecting default options',
      },
    ],
    subCommands: [],
  },
  {
    command: 'upgrade',
    commandDescription: 'Download and install the latest version of the Amplify CLI',
    commandUsage: 'amplify upgrade',
    commandFlags: [],
    subCommands: [],
  },
  {
    command: 'import',
    commandDescription: 'Imports existing resources to your local backend',
    commandUsage: 'amplify import <subcommand> [--headless <payload>]',
    commandFlags: [
      {
        short: '',
        long: 'headless',
        flagDescription: 'Headless JSON payload',
      },
    ],
    subCommands: [
      {
        subCommand: 'auth',
        subCommandDescription: 'Imports an existing auth resource to your local backend',
        subCommandUsage: 'amplify import auth',
        subCommandFlags: [],
      },
      {
        subCommand: 'env',
        subCommandDescription: 'Imports an existing Amplify project environment stack to your local backend',
        subCommandUsage: 'amplify import env [--name <env-name>] [--config <env-config>] [--awsInfo <env-aws-info>]',
        subCommandFlags: [
          {
            short: '',
            long: 'name',
            flagDescription: 'Name of the environment to import',
          },
          {
            short: '',
            long: 'config',
            flagDescription: 'Path to the environment configuration file',
          },
          {
            short: '',
            long: 'awsInfo',
            flagDescription: 'Path to the environment AWS configuration file',
          },
        ],
      },
      {
        subCommand: 'storage',
        subCommandDescription: 'Imports an existing storage resource to your local backend',
        subCommandUsage: 'amplify import storage',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'override',
    commandDescription: 'Override Amplify-generated resources with Cloud Development Kit (CDK)',
    commandUsage: 'amplify override <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'api',
        subCommandDescription: 'Override Amplify-generated GraphQL API resources',
        subCommandUsage: 'amplify override api',
        subCommandFlags: [],
      },
      {
        subCommand: 'auth',
        subCommandDescription: 'Override Amplify-generated auth resources',
        subCommandUsage: 'amplify override auth',
        subCommandFlags: [],
      },
      {
        subCommand: 'storage',
        subCommandDescription: 'Override Amplify-generated storage resources',
        subCommandUsage: 'amplify override storage',
        subCommandFlags: [],
      },
      {
        subCommand: 'project',
        subCommandDescription: 'override Amplify-generated project-level resources, such as IAM roles',
        subCommandUsage: 'amplify override project',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'diagnose',
    commandDescription: 'Capture non-sensitive Amplify backend metadata for debugging purposes',
    commandUsage: 'amplify diagnose [--send-report] [--auto-send-off] [--auto-send-on]',
    commandFlags: [
      {
        short: '',
        long: 'send-report',
        flagDescription: 'Share non-sensitive project configurations of your Amplify backend with the Amplify team',
      },
      {
        short: '',
        long: 'auto-send-off',
        flagDescription: 'Opt out of sharing your project configurations with Amplify on failures',
      },
      {
        short: '',
        long: 'auto-send-on',
        flagDescription: 'Opt in to sharing your project configurations with Amplify on failures',
      },
    ],
    subCommands: [],
  },
  {
    command: 'logout',
    commandDescription: 'Logs out of Amplify Studio',
    commandUsage: 'amplify logout [--appId <appId>]',
    commandFlags: [
      {
        short: '',
        long: 'appId <appId>',
        flagDescription: 'Specify app ID',
      },
    ],
    subCommands: [],
  },
  {
    command: 'export',
    commandDescription: 'Export Amplify CLI-generated backend as a Cloud Development Kit (CDK) stack',
    commandUsage: 'amplify export [--out <path>]',
    commandFlags: [
      {
        short: '',
        long: 'out <path>',
        flagDescription: 'Specify the output path, where this is typically the path to your CDK project',
      },
    ],
    subCommands: [],
  },
  {
    command: 'uninstall',
    commandDescription: 'Uninstall the Amplify CLI',
    commandUsage: 'amplify uninstall',
    commandFlags: [],
    subCommands: [],
  },
  {
    command: 'serve',
    commandDescription: 'Executes amplify push, and then test run the client-side application locally',
    commandUsage: 'amplify serve',
    commandFlags: [],
    subCommands: [],
  },
  {
    command: 'mock',
    commandDescription: 'Run mock server for testing categories locally',
    commandUsage: 'amplify mock [subcommand]',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'api',
        subCommandDescription: 'Run mock server for testing API locally',
        subCommandUsage: 'amplify mock api',
        subCommandFlags: [],
      },
      {
        subCommand: 'storage',
        subCommandDescription: 'Run mock server for testing storage locally',
        subCommandUsage: 'amplify mock storage',
        subCommandFlags: [],
      },
      {
        subCommand: 'function',
        subCommandDescription: 'Run mock server for testing functions locally',
        subCommandUsage: 'amplify mock function [--event <path-to-json-file>] [--timeout <number-of-seconds>]',
        subCommandFlags: [
          {
            short: '',
            long: 'event <path-to-json-file>',
            flagDescription: 'Specified JSON file as the event to pass to the Lambda handler',
          },
          {
            short: '',
            long: 'timeout <number-of-seconds>',
            flagDescription: 'Override the default 10-second function response timeout',
          },
        ],
      },
      {
        subCommand: 'function <function-name>',
        subCommandDescription: 'Run mock server for testing a specific function locally',
        subCommandUsage: 'amplify mock function <function-name>',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'codegen',
    commandDescription: 'Generates GraphQL statements and type annotations',
    commandUsage: 'amplify codegen <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'configure',
        subCommandDescription: 'Configure GraphQL codegen for your Amplify project',
        subCommandUsage: 'amplify codegen configure',
        subCommandFlags: [],
      },
      {
        subCommand: 'statements',
        subCommandDescription: 'Generates GraphQL statements (queries, mutations, and subscriptions)',
        subCommandUsage: 'amplify codegen statements',
        subCommandFlags: [],
      },
      {
        subCommand: 'types',
        subCommandDescription: 'Generates GraphQL type annotations',
        subCommandUsage: 'amplify codegen types',
        subCommandFlags: [],
      },
      {
        subCommand: 'models',
        subCommandDescription: 'Generates GraphQL DataStore models',
        subCommandUsage: 'amplify codegen models',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'api',
    commandDescription: 'Enable an easy and secure solution to access backend data',
    commandUsage: 'amplify api <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add-graphql-datasource',
        subCommandDescription: 'Add an RDS datasource to your GraphQL API',
        subCommandUsage: 'amplify api add-graphql-datasource',
        subCommandFlags: [],
      },
      {
        subCommand: 'rebuild',
        subCommandDescription: 'Removes all GraphQL resources and recreates the API (only use in dev envs)',
        subCommandUsage: 'amplify api rebuild',
        subCommandFlags: [],
      },
      {
        subCommand: 'add',
        subCommandDescription: 'Takes you through a CLI flow to add a api resource to your local backend',
        subCommandUsage: 'amplify api add',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions API cloud resources with the latest local developments',
        subCommandUsage: 'amplify api push',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes API resource from your local backend',
        subCommandUsage: 'amplify api remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Updates an API resource',
        subCommandUsage: 'amplify api update',
        subCommandFlags: [],
      },
      {
        subCommand: 'gql-compile',
        subCommandDescription: 'Compiles your GraphQL schema and generates a CloudFormation template',
        subCommandUsage: 'amplify api gql-compile',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens the web console for the selected api service',
        subCommandUsage: 'amplify api console',
        subCommandFlags: [],
      },
      {
        subCommand: 'migrate',
        subCommandDescription: 'Migrates GraphQL schemas to the latest GraphQL transformer version',
        subCommandUsage: 'amplify api migrate',
        subCommandFlags: [],
      },
      {
        subCommand: 'override',
        subCommandDescription: 'Generates overrides file to apply custom modifications to CloudFormation',
        subCommandUsage: 'amplify api override',
        subCommandFlags: [],
      },
      {
        subCommand: 'status',
        subCommandDescription: 'Displays the current status of your API',
        subCommandUsage: 'amplify api status [-acm <table-name>]',
        subCommandFlags: [
          {
            short: 'acm',
            long: '',
            flagDescription: 'Displays the access control matrix',
          },
        ],
      },
    ],
  },
  {
    command: 'storage',
    commandDescription: 'Enable a mechanism for managing user content',
    commandUsage: 'amplify storage <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Adds a storage resource to your local backend',
        subCommandUsage: 'amplify storage add',
        subCommandFlags: [],
      },
      {
        subCommand: 'import',
        subCommandDescription: 'Import an existing storage resource to your local backend',
        subCommandUsage: 'amplify storage import',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Update a storage resource',
        subCommandUsage: 'amplify storage update',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions storage cloud resources with the latest local developments',
        subCommandUsage: 'amplify storage push',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes storage resource from your local backend',
        subCommandUsage: 'amplify storage remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'override',
        subCommandDescription: "Generates 'overrides.ts' for overriding storage resources",
        subCommandUsage: 'amplify storage override',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens the web console for the storage category',
        subCommandUsage: 'amplify storage console',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'notifications',
    commandDescription: 'Configure notifications for your Amplify project',
    commandUsage: 'amplify notifications',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Adds a notification channel',
        subCommandUsage: 'amplify notifications add',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes a notification channel',
        subCommandUsage: 'amplify notifications remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Updates the configuration of a notification channel',
        subCommandUsage: 'amplify notifications update',
        subCommandFlags: [],
      },
      {
        subCommand: 'status',
        subCommandDescription: 'Lists the enabled/disabled statuses of the available notification channels',
        subCommandUsage: 'amplify notifications status',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens the Amazon Pinpoint console displaying the current channel settings',
        subCommandUsage: 'amplify notifications console',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions cloud resources with the latest local changes',
        subCommandUsage: 'amplify notifications push',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'auth',
    commandDescription: 'Enable sign-in, sign-up, and sign-out for your app',
    commandUsage: 'amplify auth <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Adds an auth resource to your local backend',
        subCommandUsage: 'amplify auth add',
        subCommandFlags: [],
      },
      {
        subCommand: 'import',
        subCommandDescription: 'Imports an existing auth resource to your local backend',
        subCommandUsage: 'amplify auth import',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions only auth cloud resources with the latest local developments',
        subCommandUsage: 'amplify auth push',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes auth resources from your local backend',
        subCommandUsage: 'amplify auth remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Updates the auth resource from your local backend',
        subCommandUsage: 'amplify auth update',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens the web console for the auth category',
        subCommandUsage: 'amplify auth console',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'geo',
    commandDescription: 'Configure geo resources for your Amplify project',
    commandUsage: 'amplify geo <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Takes you through a CLI flow to add a geo resource to your local backend',
        subCommandUsage: 'amplify geo add',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Takes you through steps in the CLI to update a geo resource',
        subCommandUsage: 'amplify geo update',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions only geo cloud resources with the latest local developments',
        subCommandUsage: 'amplify geo push',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes geo resource from your local backend',
        subCommandUsage: 'amplify geo remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens the web console for the geo category',
        subCommandUsage: 'amplify geo console',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'analytics',
    commandDescription: 'Add analytics resources to your Amplify project',
    commandUsage: 'amplify analytics <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Takes you through a CLI flow to add an analytics resource to your local backend',
        subCommandUsage: 'amplify analytics add',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Takes you through steps in the CLI to update an analytics resource',
        subCommandUsage: 'amplify analytics update',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions only analytics cloud resources with the latest local developments',
        subCommandUsage: 'amplify analytics push',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes analytics resource from your local backend',
        subCommandUsage: 'amplify analytics remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens the web console for the analytics category',
        subCommandUsage: 'amplify analytics console',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'function',
    commandDescription: 'Configure function resources for your Amplify project',
    commandUsage: 'amplify function <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Takes you through a CLI flow to add a function resource to your local backend',
        subCommandUsage: 'amplify function add',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Takes you through a CLI flow to update an existing function resource',
        subCommandUsage: 'amplify function update',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions only function cloud resources with the latest local developments',
        subCommandUsage: 'amplify function push',
        subCommandFlags: [],
      },
      {
        subCommand: 'build',
        subCommandDescription: 'Builds all the functions in the project',
        subCommandUsage: 'amplify function build',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes function resource from your local backend',
        subCommandUsage: 'amplify function remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens the web console for the function category',
        subCommandUsage: 'amplify function console',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'hosting',
    commandDescription: 'Configure hosting resources for your Amplify project',
    commandUsage: 'amplify hosting <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'serve',
        subCommandDescription: 'Opens your deployed site',
        subCommandUsage: 'amplify hosting serve',
        subCommandFlags: [],
      },
      {
        subCommand: 'configure',
        subCommandDescription: 'Configure hosting resources via the Amplify Console',
        subCommandUsage: 'amplify hosting configure',
        subCommandFlags: [],
      },
      {
        subCommand: 'publish',
        subCommandDescription: 'Publishes changes to manually deployed apps',
        subCommandUsage: 'amplify hosting publish',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Remove hosting from you app',
        subCommandUsage: 'amplify hosting remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions cloud resources with the latest local changes',
        subCommandUsage: 'amplify hosting push',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'interactions',
    commandDescription: 'Configure interactions resources for your Amplify project',
    commandUsage: 'amplify interactions <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Adds a interactions resources to your local backend',
        subCommandUsage: 'amplify interactions add',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Takes you through a CLI flow to update an interactions resource',
        subCommandUsage: 'amplify interactions update',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions only interactions cloud resources with the latest local developments',
        subCommandUsage: 'amplify interactions push',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes interactions resources from your local backend',
        subCommandUsage: 'amplify interactions remove',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'predictions',
    commandDescription: 'Configure predictions resources for your Amplify project',
    commandUsage: 'amplify predictions <subcommand>',
    commandFlags: [],
    subCommands: [
      {
        subCommand: 'add',
        subCommandDescription: 'Takes you through a CLI flow to add a predictions resource to your local backend',
        subCommandUsage: 'amplify predictions add',
        subCommandFlags: [],
      },
      {
        subCommand: 'remove',
        subCommandDescription: 'Removes predictions resource from your local backend',
        subCommandUsage: 'amplify predictions remove',
        subCommandFlags: [],
      },
      {
        subCommand: 'update',
        subCommandDescription: 'Takes you through steps in the CLI to update an predictions resource',
        subCommandUsage: 'amplify predictions update',
        subCommandFlags: [],
      },
      {
        subCommand: 'console',
        subCommandDescription: 'Opens a web console to view your predictions resource',
        subCommandUsage: 'amplify predictions console',
        subCommandFlags: [],
      },
      {
        subCommand: 'push',
        subCommandDescription: 'Provisions cloud resources with the latest local changes',
        subCommandUsage: 'amplify predictions push',
        subCommandFlags: [],
      },
    ],
  },
  {
    command: 'build',
    commandDescription: 'Builds all resources in the project',
    commandUsage: 'amplify build',
    commandFlags: [],
    subCommands: [],
  },
];
