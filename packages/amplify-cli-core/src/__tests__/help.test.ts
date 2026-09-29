import {
  $TSContext,
  CommandInfo,
  runHelp,
  commandsInfo,
  lookUpCommand,
  lookUpSubcommand,
  parseHelpCommands,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

describe('amplify help functions: ', () => {
  printer.info = jest.fn();
  const mockCommandsInfo: Array<CommandInfo> = [
    {
      command: 'init',
      commandDescription: 'Initializes a new project, sets up deployment resources in the cloud, and makes your project ready for Amplify',
      commandUsage: 'amplify init [flags]',
      commandFlags: [
        {
          short: 'y',
          long: 'yes',
          flagDescription: 'skip all interactive prompts by selecting default options',
        },
        {
          short: '',
          long: 'amplify',
          flagDescription: 'basic information of the project',
        },
        {
          short: '',
          long: 'frontend',
          flagDescription: "information for the project's frontend appliction",
        },
        {
          short: '',
          long: 'providers',
          flagDescription: 'configuration settings for provider plugins',
        },
        {
          short: '',
          long: 'categories',
          flagDescription: 'configuration settings for resources in the given categories',
        },
        {
          short: '',
          long: 'app',
          flagDescription: 'Specify a GitHub repository from which to create an Amplify project',
        },
        {
          short: '',
          long: 'permissions-boundary <IAM Policy ARN>',
          flagDescription: 'Specify an IAM permissions boundary for the roles created during init',
        },
      ],
      subCommands: [],
    },
    {
      command: 'configure',
      commandDescription: 'Configure the Amplify CLI for usage',
      commandUsage: 'amplify configure <subcommand>',
      commandFlags: [],
      subCommands: [
        {
          subCommand: 'project',
          subCommandDescription: 'Configure the attributes of your project such as switching front-end framework',
          subCommandUsage: 'amplify configure project [flags]',
          subCommandFlags: [
            {
              short: 'y',
              long: 'yes',
              flagDescription: 'skip all interactive prompts by selecting default options',
            },
            {
              short: '',
              long: 'amplify',
              flagDescription: 'basic information of the project',
            },
            {
              short: '',
              long: 'frontend',
              flagDescription: "information for the project's frontend appliction",
            },
            {
              short: '',
              long: 'providers',
              flagDescription: 'configuration settings for provider plugins',
            },
          ],
        },
        {
          subCommand: 'hosting',
          subCommandDescription: 'Configure hosting resources including S3, CloudFront, and publish ignore',
          subCommandUsage: 'amplify hosting project',
          subCommandFlags: [],
        },
        {
          subCommand: 'codegen',
          subCommandDescription: 'Configure GraphQL codegen',
          subCommandUsage: 'amplify configure codegen',
          subCommandFlags: [],
        },
      ],
    },
    {
      command: 'mock',
      commandDescription: 'Run mock server for testing categories locally',
      commandUsage: 'amplify mock <subcommand>',
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
          subCommandUsage: 'amplify mock function [flags]',
          subCommandFlags: [
            {
              short: '',
              long: 'event <path-to-json-file>',
              flagDescription: 'specified JSON file as the event to pass to the Lambda handler',
            },
            {
              short: '',
              long: 'timeout <number-of-seconds>',
              flagDescription: 'Override the default 10 second function response timeout with a custom timeout value',
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
  ];

  it('lookup valid command (init) and expect not null', () => {
    const initCommandInfo = lookUpCommand(mockCommandsInfo, 'init');
    expect(initCommandInfo).not.toBeUndefined();
  });

  it('lookup invalid command and expect null', () => {
    const invalidCommandInfo = lookUpCommand(mockCommandsInfo, 'invalidcommand');
    expect(invalidCommandInfo).toBeUndefined();
  });

  it('lookup valid command (init) and expect correct command name', () => {
    const initCommandInfo = lookUpCommand(mockCommandsInfo, 'init');
    expect(initCommandInfo!.command).toBe('init');
  });

  it('lookup valid command (configure) and expect correct command name', () => {
    const initCommandInfo = lookUpCommand(mockCommandsInfo, 'configure');
    expect(initCommandInfo!.command).toBe('configure');
  });

  it('lookup valid subcommand (configure project) and expect not null', () => {
    const configureProjectSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'configure', 'project');
    expect(configureProjectSubCommandInfo).not.toBeUndefined();
  });

  it('lookup invalid subcommand and expect null', () => {
    const invalidSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'invalidcommand', 'invalidsubcommand');
    expect(invalidSubCommandInfo).toBeUndefined();
  });

  it('lookup valid subcommand (configure project) and expect correct subcommand name', () => {
    const configureProjectSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'configure', 'project');
    expect(configureProjectSubCommandInfo!.subCommand).toBe('project');
  });

  it('lookup valid subcommand (configure hosting) correct subcommand name', () => {
    const configureHostingSubCommandInfo = lookUpSubcommand(mockCommandsInfo, 'configure', 'hosting');
    expect(configureHostingSubCommandInfo!.subCommand).toBe('hosting');
  });

  it('parse command (configure) from input', () => {
    const configureInput = {
      argv: ['node', 'amplify', 'configure', '-h'],
      command: 'help',
      options: { help: true },
      plugin: 'core',
      subCommands: ['configure'],
    };
    const specifiedCommands = parseHelpCommands(configureInput, mockCommandsInfo);
    expect(specifiedCommands.command).toBe('configure');
    expect(specifiedCommands.subCommand).toBe('');
  });

  it('parse command and subcommand (mock function) from input', () => {
    const mockFunctionInput = {
      argv: ['node', 'amplify', 'mock', 'function', '-h'],
      plugin: 'mock',
      command: 'help',
      options: { help: true, yes: false },
      subCommands: ['mock', 'function'],
    };
    const specifiedCommands = parseHelpCommands(mockFunctionInput, mockCommandsInfo);
    expect(specifiedCommands.command).toBe('mock');
    expect(specifiedCommands.subCommand).toBe('function');
  });

  it('run help invalid command', () => {
    const mockContext = {
      input: {
        argv: ['node', 'amplify', 'invalid', 'command', '-h'],
        command: 'help',
        subCommands: ['invalid', 'command'],
        options: { help: true, yes: false },
        plugin: 'core',
      },
    } as unknown as $TSContext;

    runHelp(mockContext, commandsInfo);
    expect(printer.info).toBeCalledWith('  ' + 'amplify <command> <subcommand> [flags]');
  });

  it('run help command (mock)', () => {
    const mockContext = {
      print: {
        info: jest.fn(),
      },
      input: {
        argv: ['node', 'amplify', 'mock', '-h'],
        command: 'help',
        subCommands: ['mock'],
        options: { help: true, yes: false },
        plugin: 'mock',
      },
    } as unknown as $TSContext;
    runHelp(mockContext, commandsInfo);
    expect(printer.info).toBeCalledWith('  ' + 'amplify mock [subcommand]');
  });

  it('run help subcommand (mock function)', () => {
    const mockContext = {
      print: {
        info: jest.fn(),
      },
      input: {
        argv: ['node', 'amplify', 'mock', 'function', '-h'],
        command: 'help',
        subCommands: ['mock', 'function'],
        options: { help: true, yes: false },
        plugin: 'mock',
      },
    } as unknown as $TSContext;
    runHelp(mockContext, commandsInfo);
    expect(printer.info).toBeCalledWith('  ' + 'amplify mock function [--event <path-to-json-file>] [--timeout <number-of-seconds>]');
  });
});
