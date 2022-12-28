export const commandsInfo = [
  {
    "command": "init",
    "commandDescription": "Initialize a new Amplify project",
    "commandUsage": "amplify init [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/init",
    "commandFlags": [
      {
        "short": "y",
        "long": "yes",
        "flagDescription": "Skip all interactive prompts by selecting default options"
      },
      {
        "short": "",
        "long": "amplify",
        "flagDescription": "Basic information of the project"
      },
      {
        "short": "",
        "long": "frontend",
        "flagDescription": "Information for the project's frontend appliction"
      },
      {
        "short": "",
        "long": "providers",
        "flagDescription": "Configuration settings for provider plugins"
      },
      {
        "short": "",
        "long": "categories",
        "flagDescription": "Configuration settings for resources in the given categories"
      },
      {
        "short": "",
        "long": "app",
        "flagDescription": "Specify a GitHub repository from which to create an Amplify project"
      },
      {
        "short": "",
        "long": "permissions-boundary <ARN>",
        "flagDescription": "Specify an IAM permissions boundary for the roles created during init"
      }
    ],
    "subCommands": []
  },
  {
    "command": "configure",
    "commandDescription": "Configure the CLI to work with your AWS profile",
    "commandUsage": "amplify configure <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/configure",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "project",
        "subCommandDescription": "Configure the attributes of your project",
        "subCommandUsage": "amplify configure project [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/configure",
        "subCommandFlags": [
          {
            "short": "y",
            "long": "yes",
            "flagDescription": "Skip all interactive prompts by selecting default options"
          },
          {
            "short": "",
            "long": "amplify",
            "flagDescription": "Basic information of the project"
          },
          {
            "short": "",
            "long": "frontend",
            "flagDescription": "Information for the project's frontend appliction"
          },
          {
            "short": "",
            "long": "providers",
            "flagDescription": "Configuration settings for provider plugins"
          }
        ]
      },
      {
        "subCommand": "hosting",
        "subCommandDescription": "Configure hosting resources for your Amplify project",
        "subCommandUsage": "amplify configure hosting",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/configure",
        "subCommandFlags": []
      },
      {
        "subCommand": "codegen",
        "subCommandDescription": "Configure GraphQL codegen for your Amplify project",
        "subCommandUsage": "amplify configure codegen",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/configure",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "push",
    "commandDescription": "Provisions cloud resources with the latest local changes",
    "commandUsage": "amplify push <category> [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/push",
    "commandFlags": [
      {
        "short": "",
        "long": "codegen",
        "flagDescription": "Configuration for GraphQL codegen"
      },
      {
        "short": "f",
        "long": "force",
        "flagDescription": "Pushes all resources regardless of update status and bypasses all guardrails"
      },
      {
        "short": "y",
        "long": "yes",
        "flagDescription": "Skip all interactive prompts by selecting default options"
      },
      {
        "short": "",
        "long": "allow-destructive-graphql-schema-updates",
        "flagDescription": "Pushes schema changes that require removal or replacement of underlying tables"
      },
      {
        "short": "",
        "long": "headless",
        "flagDescription": "Headless JSON payload (see https://docs.amplify.aws/cli/usage/headless)"
      }
    ],
    "subCommands": [
      {
        "subCommand": "<category>",
        "subCommandDescription": "Provisions cloud resources with the latest local changes for a single category",
        "subCommandUsage": "amplify push <category> [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/push",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "pull",
    "commandDescription": "Fetch upstream backend changes from the cloud and updates the local environment",
    "commandUsage": "amplify pull [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/pull",
    "commandFlags": [
      {
        "short": "y",
        "long": "yes",
        "flagDescription": "Skip all interactive prompts by selecting default options"
      },
      {
        "short": "",
        "long": "restore",
        "flagDescription": "Overwrite your local backend changes with configurations from the cloud"
      },
      {
        "short": "",
        "long": "amplify",
        "flagDescription": "Basic information of the project"
      },
      {
        "short": "",
        "long": "frontend",
        "flagDescription": "Information for the project's frontend appliction"
      },
      {
        "short": "",
        "long": "providers",
        "flagDescription": "Configuration settings for provider plugins"
      }
    ],
    "subCommands": []
  },
  {
    "command": "env",
    "commandDescription": "Displays and manages environment related information for your Amplify project",
    "commandUsage": "amplify env <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Adds a new environment to your Amplify Project",
        "subCommandUsage": "amplify env add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": []
      },
      {
        "subCommand": "checkout <env-name>",
        "subCommandDescription": "Moves your environment to the environment specified in the command",
        "subCommandUsage": "amplify env checkout <env-name> [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": [
          {
            "short": "",
            "long": "restore",
            "flagDescription": "Overwrite your local backend with that of the specified environment"
          }
        ]
      },
      {
        "subCommand": "get",
        "subCommandDescription": "Displays and manages environment related information for your Amplify project",
        "subCommandUsage": "amplify env get [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": [
          {
            "short": "",
            "long": "name <env-name>",
            "flagDescription": "Specify name"
          },
          {
            "short": "",
            "long": "json",
            "flagDescription": "Get environment information in JSON format"
          }
        ]
      },
      {
        "subCommand": "import",
        "subCommandDescription": "Imports an existing Amplify project environment stack to your local backend",
        "subCommandUsage": "amplify env import [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": [
          {
            "short": "",
            "long": "name <env-name>",
            "flagDescription": "Specify name"
          },
          {
            "short": "",
            "long": "config <provider-configs>",
            "flagDescription": "Specify configuration file"
          },
          {
            "short": "",
            "long": "awsInfo <aws-configs>",
            "flagDescription": "Specify AWS account info"
          }
        ]
      },
      {
        "subCommand": "list",
        "subCommandDescription": "Displays a list of all the environments in your Amplify project",
        "subCommandUsage": "amplify env list [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": [
          {
            "short": "",
            "long": "details",
            "flagDescription": "List environment details"
          },
          {
            "short": "",
            "long": "json",
            "flagDescription": "List environment details in JSON format"
          }
        ]
      },
      {
        "subCommand": "pull",
        "subCommandDescription": "Pulls your environment with the current cloud environment",
        "subCommandUsage": "amplify env pull [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": [
          {
            "short": "y",
            "long": "yes",
            "flagDescription": "Skip all interactive prompts by selecting default options"
          },
          {
            "short": "",
            "long": "restore",
            "flagDescription": "Overwrite your local backend with that of the specified environment"
          }
        ]
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes an environment from the Amplify project",
        "subCommandUsage": "amplify env remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Update the environment configuration",
        "subCommandUsage": "amplify env update [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/env",
        "subCommandFlags": [
          {
            "short": "",
            "long": "permissions-boundary <IAM Policy ARN>",
            "flagDescription": "Set a permisions boundary"
          }
        ]
      }
    ]
  },
  {
    "command": "add",
    "commandDescription": "Adds a resource for an Amplify category in your local backend",
    "commandUsage": "amplify add <category>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/add",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "<category>",
        "subCommandDescription": "Adds a resource for an Amplify category in your local backend",
        "subCommandUsage": "amplify add <category> [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/add",
        "subCommandFlags": [
          {
            "short": "",
            "long": "headless",
            "flagDescription": "Headless JSON payload (see https://docs.amplify.aws/cli/usage/headless)"
          }
        ]
      }
    ]
  },
  {
    "command": "status",
    "commandDescription": "Shows the state of local resources not yet pushed to the cloud",
    "commandUsage": "amplify status [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/status",
    "commandFlags": [
      {
        "short": "v",
        "long": "verbose",
        "flagDescription": "Shows verbose details, including cloudformation differences"
      }
    ],
    "subCommands": [
      {
        "subCommand": "<category>",
        "subCommandDescription": "Shows the state of local resources not yet pushed to the cloud",
        "subCommandUsage": "amplify status <category> [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/status",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "plugin",
    "commandDescription": "Configure Amplify plugins",
    "commandUsage": "amplify pluigin <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "init",
        "subCommandDescription": "Scaffolds a skeleton Amplify CLI plugin",
        "subCommandUsage": "amplify plugin init",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
        "subCommandFlags": []
      },
      {
        "subCommand": "configure",
        "subCommandDescription": "Configures Amplify CLI plugin options",
        "subCommandUsage": "amplify plugin configure",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
        "subCommandFlags": []
      },
      {
        "subCommand": "list",
        "subCommandDescription": "Lists general plugin information",
        "subCommandUsage": "amplify plugin list",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
        "subCommandFlags": []
      },
      {
        "subCommand": "scan",
        "subCommandDescription": "Explicitly starts a scan/search for new and existing plugins",
        "subCommandUsage": "amplify plugin scan",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
        "subCommandFlags": []
      },
      {
        "subCommand": "add",
        "subCommandDescription": "Explicitly adds a plugin for the Amplify CLI to use",
        "subCommandUsage": "amplify plugin add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Explicitly removes a plugin from the Amplify CLI",
        "subCommandUsage": "amplify plugin remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
        "subCommandFlags": []
      },
      {
        "subCommand": "verify",
        "subCommandDescription": "Verifies if a plugin package/directory is a valid Amplify CLI plugin",
        "subCommandUsage": "amplify plugin verify",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/plugin",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "update",
    "commandDescription": "Update resource for an Amplify category in your local backend",
    "commandUsage": "amplify update <category>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/update",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "<category>",
        "subCommandDescription": "Update resource for an Amplify category in your local backend",
        "subCommandUsage": "amplify update <category> [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/update",
        "subCommandFlags": [
          {
            "short": "",
            "long": "headless",
            "flagDescription": "Headless JSON payload (see https://docs.amplify.aws/cli/usage/headless)"
          }
        ]
      }
    ]
  },
  {
    "command": "publish",
    "commandDescription": "Executes amplify push and builds, hosts the frontend app",
    "commandUsage": "amplify publish [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/publish",
    "commandFlags": [
      {
        "short": "y",
        "long": "yes",
        "flagDescription": "Automatically accept publish prompt"
      },
      {
        "short": "",
        "long": "codegen",
        "flagDescription": "Configuration for GraphQL codegen"
      },
      {
        "short": "f",
        "long": "force",
        "flagDescription": "Pushes all resources regardless of update status and bypasses all guardrails"
      },
      {
        "short": "",
        "long": "allow-destructive-graphql-schema-updates",
        "flagDescription": "Pushes schema changes that require removal or replacement of underlying tables"
      },
      {
        "short": "c",
        "long": "invalidateCloudFront",
        "flagDescription": "Send an invalidation request to the Amazon CloudFront service"
      }
    ],
    "subCommands": []
  },
  {
    "command": "remove",
    "commandDescription": "Removes a resource for an Amplify category in your local backend",
    "commandUsage": "amplify remove <category>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/remove",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "<category>",
        "subCommandDescription": "Removes a resource for an Amplify category in your local backend",
        "subCommandUsage": "amplify remove <category> [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/remove",
        "subCommandFlags": [
          {
            "short": "",
            "long": "headless",
            "flagDescription": "Headless JSON payload (see https://docs.amplify.aws/cli/usage/headless)"
          }
        ]
      }
    ]
  },
  {
    "command": "console",
    "commandDescription": "Opens the web console for the selected cloud resource",
    "commandUsage": "amplify console <category>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/console",
    "commandFlags": [],
    "subCommands": []
  },
  {
    "command": "delete",
    "commandDescription": "Delete the Amplify project",
    "commandUsage": "amplify delete [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/delete",
    "commandFlags": [
      {
        "short": "y",
        "long": "yes",
        "flagDescription": "Skip all interactive prompts by selecting default options"
      },
      {
        "short": "f",
        "long": "force",
        "flagDescription": "Skip all interactive prompts by selecting default options"
      }
    ],
    "subCommands": []
  },
  {
    "command": "upgrade",
    "commandDescription": "Download and install the latest version of the Amplify CLI",
    "commandUsage": "amplify upgrade",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/upgrade",
    "commandFlags": [],
    "subCommands": []
  },
  {
    "command": "import",
    "commandDescription": "Imports existing resources to your local backend",
    "commandUsage": "amplify import <subcommand> [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/import",
    "commandFlags": [
      {
        "short": "",
        "long": "headless",
        "flagDescription": "Headless JSON payload (see https://docs.amplify.aws/cli/usage/headless)"
      }
    ],
    "subCommands": [
      {
        "subCommand": "auth",
        "subCommandDescription": "Imports an existing auth resource to your local backend",
        "subCommandUsage": "amplify import auth [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/import",
        "subCommandFlags": []
      },
      {
        "subCommand": "env",
        "subCommandDescription": "Imports an existing Amplify project environment stack to your local backend",
        "subCommandUsage": "amplify import env [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/import",
        "subCommandFlags": []
      },
      {
        "subCommand": "storage",
        "subCommandDescription": "Imports an existing storage resource to your local backend",
        "subCommandUsage": "amplify import storage [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/import",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "override",
    "commandDescription": "Override Amplify-generated resources with Cloud Development Kit (CDK)",
    "commandUsage": "amplify override <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/override",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "api",
        "subCommandDescription": "Override Amplify-generated GraphQL API resources",
        "subCommandUsage": "amplify override api",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/override",
        "subCommandFlags": []
      },
      {
        "subCommand": "auth",
        "subCommandDescription": "Override Amplify-generated auth resources",
        "subCommandUsage": "amplify override auth",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/override",
        "subCommandFlags": []
      },
      {
        "subCommand": "storage",
        "subCommandDescription": "Override Amplify-generated storage resources",
        "subCommandUsage": "amplify override storage",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/override",
        "subCommandFlags": []
      },
      {
        "subCommand": "project",
        "subCommandDescription": "override Amplify-generated project-level resources, such as IAM roles",
        "subCommandUsage": "amplify override project",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/override",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "diagnose",
    "commandDescription": "Capture non-sensitive Amplify backend metadata for debugging purposes",
    "commandUsage": "amplify diagnose [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/diagnose",
    "commandFlags": [
      {
        "short": "",
        "long": "send-report",
        "flagDescription": "Share non-sensitive configurations of your Amplify backend with the Amplify team"
      },
      {
        "short": "",
        "long": "auto-send-off",
        "flagDescription": "Opt out of sharing your project configurations with Amplify on failures"
      },
      {
        "short": "",
        "long": "auto-send-on",
        "flagDescription": "Opt in to sharing your project configurations with Amplify on failures"
      }
    ],
    "subCommands": []
  },
  {
    "command": "logout",
    "commandDescription": "Logs out of Amplify Studio",
    "commandUsage": "amplify logout [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/logout",
    "commandFlags": [
      {
        "short": "",
        "long": "appId <appId>",
        "flagDescription": "Specify app ID"
      }
    ],
    "subCommands": []
  },
  {
    "command": "export",
    "commandDescription": "Export Amplify CLI-generated backends as a Cloud Development Kit (CDK) stack",
    "commandUsage": "amplify export [flags]",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/export",
    "commandFlags": [
      {
        "short": "",
        "long": "out <path>",
        "flagDescription": "Specify the output path, where this is typically the path to your CDK project"
      }
    ],
    "subCommands": []
  },
  {
    "command": "uninstall",
    "commandDescription": "Uninstall the Amplify CLI",
    "commandUsage": "amplify uninstall",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/uninstall",
    "commandFlags": [],
    "subCommands": []
  },
  {
    "command": "serve",
    "commandDescription": "Executes amplify push, and then test run the client-side application locally",
    "commandUsage": "amplify serve",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/serve",
    "commandFlags": [],
    "subCommands": []
  },
  {
    "command": "mock",
    "commandDescription": "Run mock server for testing categories locally",
    "commandUsage": "amplify mock <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/mock",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "api",
        "subCommandDescription": "Run mock server for testing API locally",
        "subCommandUsage": "amplify mock api",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/mock",
        "subCommandFlags": []
      },
      {
        "subCommand": "storage",
        "subCommandDescription": "Run mock server for testing storage locally",
        "subCommandUsage": "amplify mock storage",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/mock",
        "subCommandFlags": []
      },
      {
        "subCommand": "function",
        "subCommandDescription": "Run mock server for testing functions locally",
        "subCommandUsage": "amplify mock function [flags]",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/mock",
        "subCommandFlags": [
          {
            "short": "",
            "long": "event <path-to-json-file>",
            "flagDescription": "Specified JSON file as the event to pass to the Lambda handler"
          },
          {
            "short": "",
            "long": "timeout <number-of-seconds>",
            "flagDescription": "Override the default 10-second function response timeout"
          }
        ]
      },
      {
        "subCommand": "function <function-name>",
        "subCommandDescription": "Run mock server for testing a specific function locally",
        "subCommandUsage": "amplify mock function <function-name>",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/mock",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "codegen",
    "commandDescription": "Generates GraphQL statements and type annotations",
    "commandUsage": "amplify codegen <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/codegen",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "configure",
        "subCommandDescription": "Configure GraphQL codegen for your Amplify project",
        "subCommandUsage": "amplify codegen configure",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/codegen",
        "subCommandFlags": []
      },
      {
        "subCommand": "statements",
        "subCommandDescription": "Generates GraphQL statements (queries, mutations, and subscriptions)",
        "subCommandUsage": "amplify codegen statements",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/codegen",
        "subCommandFlags": []
      },
      {
        "subCommand": "types",
        "subCommandDescription": "Generates GraphQL type annotations",
        "subCommandUsage": "amplify codegen types",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/codegen",
        "subCommandFlags": []
      },
      {
        "subCommand": "models",
        "subCommandDescription": "Generates GraphQL DataStore models",
        "subCommandUsage": "amplify codegen models",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/codegen",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "api",
    "commandDescription": "Enable an easy and secure solution to access backend data",
    "commandUsage": "amplify api <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add-graphql-datasource",
        "subCommandDescription": "Add an RDS datasource to your GraphQL API",
        "subCommandUsage": "amplify api add-graphql-datasource",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "rebuild",
        "subCommandDescription": "Removes all GraphQL resources and recreates the API (only use in dev envs)",
        "subCommandUsage": "amplify api rebuild",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "add",
        "subCommandDescription": "Takes you through a CLI flow to add a api resource to your local backend",
        "subCommandUsage": "amplify api add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions API cloud resources with the latest local developments",
        "subCommandUsage": "amplify api push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes API resource from your local backend",
        "subCommandUsage": "amplify api remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Updates an API resource",
        "subCommandUsage": "amplify api update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "gql-compile",
        "subCommandDescription": "Compiles your GraphQL schema and generates a CloudFormation template",
        "subCommandUsage": "amplify api gql-conpile",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "console",
        "subCommandDescription": "Opens the web console for the selected api service",
        "subCommandUsage": "amplify api console",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "migrate",
        "subCommandDescription": "Migrates GraphQL schemas to the latest GraphQL transformer version",
        "subCommandUsage": "amplify api migrate",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "override",
        "subCommandDescription": "Generates overrides file to apply custom modifications to CloudFormation",
        "subCommandUsage": "amplify api override",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions cloud resources with the latest local changes",
        "subCommandUsage": "amplify api push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/api",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "storage",
    "commandDescription": "Enable a mechanism for managing user content",
    "commandUsage": "amplify storage <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Adds a storage resource to your local backend",
        "subCommandUsage": "amplify storage add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
        "subCommandFlags": []
      },
      {
        "subCommand": "import",
        "subCommandDescription": "Import an existing storage resource to your local backend",
        "subCommandUsage": "amplify storage import",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Update a storage resource",
        "subCommandUsage": "amplify storage update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions storage cloud resources with the latest local developments",
        "subCommandUsage": "amplify storage push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes storage resource from your local backend",
        "subCommandUsage": "amplify storage remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
        "subCommandFlags": []
      },
      {
        "subCommand": "override",
        "subCommandDescription": "Generates 'overrides.ts' for overriding storage resources",
        "subCommandUsage": "amplify storage override",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions cloud resources with the latest local changes",
        "subCommandUsage": "amplify storage override",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/storage",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "notifications",
    "commandDescription": "Configure notifications for your Amplify project",
    "commandUsage": "amplify notifications",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/notifications",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Adds a notification channel",
        "subCommandUsage": "amplify notifications add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/notifications",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes a notification channel",
        "subCommandUsage": "amplify notifications remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/notifications",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Updates the configuration of a notification channel",
        "subCommandUsage": "amplify notifications update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/notifications",
        "subCommandFlags": []
      },
      {
        "subCommand": "status",
        "subCommandDescription": "Lists the enabled/disabled statuses of the available notification channels",
        "subCommandUsage": "amplify notifications status",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/notifications",
        "subCommandFlags": []
      },
      {
        "subCommand": "console",
        "subCommandDescription": "Opens the Amazon Pinpoint console displaying the current channel settings",
        "subCommandUsage": "amplify notifications console",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/notifications",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions cloud resources with the latest local changes",
        "subCommandUsage": "amplify notifications push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/notifications",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "auth",
    "commandDescription": "Enable sign-in, sign-up, and sign-out for your app",
    "commandUsage": "amplify auth <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Adds an auth resource to your local backend",
        "subCommandUsage": "amplify auth add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
        "subCommandFlags": []
      },
      {
        "subCommand": "import",
        "subCommandDescription": "Imports an existing auth resource to your local backend",
        "subCommandUsage": "amplify auth import",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions only auth cloud resources with the latest local developments",
        "subCommandUsage": "amplify auth push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes auth resources from your local backend",
        "subCommandUsage": "amplify auth remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Updates the auth resource from your local backend",
        "subCommandUsage": "amplify auth update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
        "subCommandFlags": []
      },
      {
        "subCommand": "console",
        "subCommandDescription": "Opens the web console for the auth category",
        "subCommandUsage": "amplify auth console",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions cloud resources with the latest local changes",
        "subCommandUsage": "amplify auth push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/auth",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "geo",
    "commandDescription": "Configure geo resources for your Amplify project",
    "commandUsage": "amplify geo <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/geo",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Takes you through a CLI flow to add a geo resource to your local backend",
        "subCommandUsage": "amplify geo add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/geo",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Takes you through steps in the CLI to update a geo resource",
        "subCommandUsage": "amplify geo update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/geo",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions only geo cloud resources with the latest local developments",
        "subCommandUsage": "amplify geo push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/geo",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes geo resource from your local backend",
        "subCommandUsage": "amplify geo remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/geo",
        "subCommandFlags": []
      },
      {
        "subCommand": "console",
        "subCommandDescription": "Opens the web console for the geo category",
        "subCommandUsage": "amplify geo console",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/geo",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "analytics",
    "commandDescription": "Add analytics resources to your Amplify project",
    "commandUsage": "amplify analytics <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/analytics",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Takes you through a CLI flow to add an analytics resource to your local backend",
        "subCommandUsage": "amplify analytics add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/analytics",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Takes you through steps in the CLI to update an analytics resource",
        "subCommandUsage": "amplify analytics update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/analytics",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions only analytics cloud resources with the latest local developments",
        "subCommandUsage": "amplify analytics push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/analytics",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes analytics resource from your local backend",
        "subCommandUsage": "amplify analytics remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/analytics",
        "subCommandFlags": []
      },
      {
        "subCommand": "console",
        "subCommandDescription": "Opens the web console for the analytics category",
        "subCommandUsage": "amplify analytics console",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/analytics",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "function",
    "commandDescription": "Configure function resources for your Amplify project",
    "commandUsage": "amplify function <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/function",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Takes you through a CLI flow to add a function resource to your local backend",
        "subCommandUsage": "amplify function add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/function",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Takes you through a CLI flow to update an existing function resource",
        "subCommandUsage": "amplify function update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/function",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions only function cloud resources with the latest local developments",
        "subCommandUsage": "amplify function push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/function",
        "subCommandFlags": []
      },
      {
        "subCommand": "build",
        "subCommandDescription": "Removes function resource from your local backend",
        "subCommandUsage": "amplify function build",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/function",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Builds all the functions in the project",
        "subCommandUsage": "amplify function remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/function",
        "subCommandFlags": []
      },
      {
        "subCommand": "console",
        "subCommandDescription": "Opens the web console for the function category",
        "subCommandUsage": "amplify function console",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/function",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "hosting",
    "commandDescription": "Configure hosting resources for your Amplify project",
    "commandUsage": "amplify hosting <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/hosting",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "serve",
        "subCommandDescription": "Opens your deployed site",
        "subCommandUsage": "amplify hosting serve",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/hosting",
        "subCommandFlags": []
      },
      {
        "subCommand": "configure",
        "subCommandDescription": "Configure hosting resources via the Amplify Console",
        "subCommandUsage": "amplify hosting configure",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/hosting",
        "subCommandFlags": []
      },
      {
        "subCommand": "publish",
        "subCommandDescription": "Publishes changes to manually deployed apps",
        "subCommandUsage": "amplify hosting publish",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/hosting",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Remove hosting from you app",
        "subCommandUsage": "amplify hosting remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/hosting",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions cloud resources with the latest local changes",
        "subCommandUsage": "amplify hosting push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/hosting",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "interactions",
    "commandDescription": "Configure interactions resources for your Amplify project",
    "commandUsage": "amplify interactions <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/interactions",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Adds a interactions resources to your local backend",
        "subCommandUsage": "amplify interactions add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/interactions",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Takes you through a CLI flow to update an interactions resource",
        "subCommandUsage": "amplify interactions update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/interactions",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions only interactions cloud resources with the latest local developments",
        "subCommandUsage": "amplify interactions push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/interactions",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes interactions resources from your local backend",
        "subCommandUsage": "amplify interactions remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/interactions",
        "subCommandFlags": []
      }
    ]
  },
  {
    "command": "predictions",
    "commandDescription": "Configure predictions resources for your Amplify project",
    "commandUsage": "amplify predictions <subcommand>",
    "learnMoreLink": "https://docs.amplify.aws/cli/commands/predictions",
    "commandFlags": [],
    "subCommands": [
      {
        "subCommand": "add",
        "subCommandDescription": "Takes you through a CLI flow to add a predictions resource to your local backend",
        "subCommandUsage": "amplify predictions add",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/predictions",
        "subCommandFlags": []
      },
      {
        "subCommand": "remove",
        "subCommandDescription": "Removes predictions resource from your local backend",
        "subCommandUsage": "amplify predictions remove",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/predictions",
        "subCommandFlags": []
      },
      {
        "subCommand": "update",
        "subCommandDescription": "Takes you through steps in the CLI to update an predictions resource",
        "subCommandUsage": "amplify predictions update",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/predictions",
        "subCommandFlags": []
      },
      {
        "subCommand": "console",
        "subCommandDescription": "Opens a web console to view your predictions resource",
        "subCommandUsage": "amplify predictions console",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/predictions",
        "subCommandFlags": []
      },
      {
        "subCommand": "push",
        "subCommandDescription": "Provisions cloud resources with the latest local changes",
        "subCommandUsage": "amplify predictions push",
        "learnMoreLink": "https://docs.amplify.aws/cli/commands/predictions",
        "subCommandFlags": []
      }
    ]
  }
];