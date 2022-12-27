import { $TSContext } from 'amplify-cli-core';
import { runHelp, commandsInfo, lookUpCommand, lookUpSubcommand, parseHelpCommands } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

describe('amplify help functions: ', () => {
    printer.info = jest.fn();
    const mockCommandsInfo = [{
            "command": "init",
            "commandDescription": "Initializes a new project, sets up deployment resources in the cloud, and makes your project ready for Amplify",
            "commandUsage": "amplify init [flags]",
            "learnMoreLink": "https://docs.amplify.aws/",
            "commandFlags": [
            {
                "short": "y",
                "long": "yes",
                "flagDescription": "skip all interactive prompts by selecting default options"
            },
            {
                "short": "",
                "long": "amplify",
                "flagDescription": "basic information of the project"
            },
            {
                "short": "",
                "long": "frontend",
                "flagDescription": "information for the project's frontend appliction"
            },
            {
                "short": "",
                "long": "providers",
                "flagDescription": "configuration settings for provider plugins"
            },
            {
                "short": "",
                "long": "categories",
                "flagDescription": "configuration settings for resources in the given categories"
            },
            {
                "short": "",
                "long": "app",
                "flagDescription": "Specify a GitHub repository from which to create an Amplify project"
            },
            {
                "short": "",
                "long": "permissions-boundary <IAM Policy ARN>",
                "flagDescription": "Specify an IAM permissions boundary for the roles created during init"
            }
            ],
            "subCommands": []
        },
        {
            "command": "configure",
            "commandDescription": "Configure the Amplify CLI for usage",
            "commandUsage": "amplify configure <subcommand>",
            "learnMoreLink": "https://docs.amplify.aws/",
            "commandFlags": [],
            "subCommands": [
            {
                "subCommand": "project",
                "subCommandDescription": "Configure the attributes of your project such as switching front-end framework",
                "subCommandUsage": "amplify configure project [flags]",
                "learnMoreLink": "https://docs.amplify.aws/",
                "subCommandFlags": [
                {
                    "short": "y",
                    "long": "yes",
                    "flagDescription": "skip all interactive prompts by selecting default options"
                },
                {
                    "short": "",
                    "long": "amplify",
                    "flagDescription": "basic information of the project"
                },
                {
                    "short": "",
                    "long": "frontend",
                    "flagDescription": "information for the project's frontend appliction"
                },
                {
                    "short": "",
                    "long": "providers",
                    "flagDescription": "configuration settings for provider plugins"
                }
                ]
            },
            {
                "subCommand": "hosting",
                "subCommandDescription": "Configure hosting resources including S3, CloudFront, and publish ignore",
                "subCommandUsage": "amplify hosting project",
                "learnMoreLink": "https://docs.amplify.aws/",
                "subCommandFlags": []
            },
            {
                "subCommand": "codegen",
                "subCommandDescription": "Configure GraphQL codegen",
                "subCommandUsage": "amplify configure codegen",
                "learnMoreLink": "https://docs.amplify.aws/",
                "subCommandFlags": []
            }
            ]
        },
        {
            "command": "mock",
            "commandDescription": "Run mock server for testing categories locally",
            "commandUsage": "amplify mock <subcommand>",
            "learnMoreLink": "https://docs.amplify.aws/",
            "commandFlags": [],
            "subCommands": [
              {
                "subCommand": "api",
                "subCommandDescription": "Run mock server for testing API locally",
                "subCommandUsage": "amplify mock api",
                "learnMoreLink": "https://docs.amplify.aws/",
                "subCommandFlags": []
              },
              {
                "subCommand": "storage",
                "subCommandDescription": "Run mock server for testing storage locally",
                "subCommandUsage": "amplify mock storage",
                "learnMoreLink": "https://docs.amplify.aws/",
                "subCommandFlags": []
              },
              {
                "subCommand": "function",
                "subCommandDescription": "Run mock server for testing functions locally",
                "subCommandUsage": "amplify mock function [flags]",
                "learnMoreLink": "https://docs.amplify.aws/",
                "subCommandFlags": [
                  {
                    "short": "",
                    "long": "event <path-to-json-file>",
                    "flagDescription": "specified JSON file as the event to pass to the Lambda handler"
                  },
                  {
                    "short": "",
                    "long": "timeout <number-of-seconds>",
                    "flagDescription": "Override the default 10 second function response timeout with a custom timeout value"
                  }
                ]
              },
              {
                "subCommand": "function <function-name>",
                "subCommandDescription": "Run mock server for testing a specific function locally",
                "subCommandUsage": "amplify mock function <function-name>",
                "learnMoreLink": "https://docs.amplify.aws/",
                "subCommandFlags": []
              }
            ]
          },
    ];

    it('test lookup command init not null', () => {
        let initCommandInfo = lookUpCommand(mockCommandsInfo, 'init');
        expect(initCommandInfo).not.toBeNull();
    });

    it('test lookup command invalid is null', () => {
        let invalidCommandInfo = lookUpCommand(mockCommandsInfo, 'invalidcommand');
        expect(invalidCommandInfo).toBeNull();
    });

    it('test lookup command init correct command name', () => {
        let initCommandInfo = lookUpCommand(mockCommandsInfo, 'init');
        expect(initCommandInfo!.command).toBe('init');
    });

    it('test lookup command configure correct command name', () => {
        let initCommandInfo = lookUpCommand(mockCommandsInfo, 'configure');
        expect(initCommandInfo!.command).toBe('configure');
    });

    it('test lookup subcommand configure project not null', () => {
        let configureProjectSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'configure', 'project');
        expect(configureProjectSubCommandInfo).not.toBeNull();
    });

    it('test lookup subcommand invalid is null', () => {
        let invalidSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'invalidcommand', 'invalidsubcommand');
        expect(invalidSubCommandInfo).toBeNull();
    });

    it('test lookup subcommand configure project correct subcommand name', () => {
        let configureProjectSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'configure', 'project');
        expect(configureProjectSubCommandInfo!.subCommand).toBe('project');
    });

    it('test lookup subcommand configure hosting correct subcommand name', () => {
        let configureHostingSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'configure', 'hosting');
        expect(configureHostingSubCommandInfo!.subCommand).toBe('hosting');
    });

    it('test parse configure from input', () => {
        const configureInput = {
            argv: [
              'node',
              'amplify',
              'configure',
              '-h'
            ],
            command: 'help',
            options: { help: true },
            plugin: 'core',
            subCommands: [ 'configure' ]
        };
        let specifiedCommands = parseHelpCommands(configureInput, mockCommandsInfo);
        expect(specifiedCommands.command).toBe('configure');
        expect(specifiedCommands.subCommand).toBe('');
    });

    it('test parse mock function from input', () => {
        const mockFunctionInput = {
            argv: [
              'node',
              'amplify',
              'mock',
              'function',
              '-h'
            ],
            plugin: 'mock',
            command: 'help',
            options: { help: true, yes: false },
            subCommands: [ 'mock', 'function' ]
        };
        let specifiedCommands = parseHelpCommands(mockFunctionInput, mockCommandsInfo);
        expect(specifiedCommands.command).toBe('mock');
        expect(specifiedCommands.subCommand).toBe('function');
    });

    it('test run help invalid command', () => {
        let mockContext: $TSContext;
        mockContext = {
            input: {
                argv: [
                  'node',
                  'amplify',
                  'invalid',
                  'command',
                  '-h'
                ],
                command: 'help',
                subCommands: [ 'invalid', 'command' ],
                options: { help: true, yes: false },
                plugin: 'core'
              },
        } as unknown as $TSContext;

        runHelp(mockContext, commandsInfo);
        expect(printer.info).toBeCalledWith("  " + "amplify <command> <subcommand> [flags]");
    });

    it('test run help mock', () => {
        let mockContext: $TSContext;

        mockContext = {
            print: {
                info: jest.fn(),
            },
            input: {
                argv: [
                  'node',
                  'amplify',
                  'mock',
                  '-h'
                ],
                command: 'help',
                subCommands: [ 'mock' ],
                options: { help: true, yes: false },
                plugin: 'mock'
              },
        } as unknown as $TSContext;
        runHelp(mockContext, commandsInfo);
        expect(printer.info).toBeCalledWith("  " + "amplify mock <subcommand>");
    });

    it('test run help mock function', () => {
        let mockContext: $TSContext;

        mockContext = {
            print: {
                info: jest.fn(),
            },
            input: {
                argv: [
                  'node',
                  'amplify',
                  'mock',
                  'function',
                  '-h'
                ],
                command: 'help',
                subCommands: [ 'mock', 'function' ],
                options: { help: true, yes: false },
                plugin: 'mock'
              },
        } as unknown as $TSContext;
        runHelp(mockContext, commandsInfo);
        expect(printer.info).toBeCalledWith("  " + "amplify mock function [flags]");
    });
});