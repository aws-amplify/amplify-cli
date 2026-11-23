/* eslint-disable spellcheck/spell-checker */
import { constants } from '@aws-amplify/amplify-cli-core';
import { ICommandInput } from '@aws-amplify/amplify-cli-shared-interfaces';
import { CLIInput } from '../command-input';

/**
 * A plugin or command known to the CLI, along with its known commands or subcommands.
 */
export type KnownCommand = {
  readonly subCommands?: Readonly<Record<string, KnownCommand>>;
};

/**
 * Recorded in place of each name that is not a known plugin, command or subcommand.
 */
const unknownNamePlaceholder = '<unknown>';

const leaves = (...names: string[]): Record<string, KnownCommand> => Object.fromEntries(names.map((name) => [name, {}]));

const withSubCommands = (...names: string[]): KnownCommand => ({ subCommands: leaves(...names) });

const coreCommands: KnownCommand = {
  subCommands: {
    ...leaves(
      'build',
      'categories',
      'console',
      'delete',
      'diagnose',
      'drift',
      'help',
      'init',
      'logout',
      'migrate',
      'publish',
      'pull',
      'push',
      'report',
      'run',
      'uninstall',
      'upgrade',
      'version',
    ),
    configure: withSubCommands('project'),
    env: withSubCommands('add', 'checkout', 'get', 'help', 'import', 'list', 'ls', 'pull', 'remove', 'update'),
    export: withSubCommands('pull'),
    'gen2-migration': withSubCommands('assess', 'generate', 'lock', 'refactor', 'retain'),
    plugin: withSubCommands('add', 'configure', 'help', 'init', 'list', 'new', 'remove', 'scan', 'verify'),
    status: withSubCommands(
      'analytics',
      'api',
      'auth',
      'custom',
      'function',
      'help',
      'hosting',
      'interactions',
      'notifications',
      'predictions',
      'storage',
      'verbose',
    ),
  },
};

const awsCloudFormationCommands = withSubCommands('configure', 'console', 'help', 'override', 'reset-cache', 'setupNewUser');
const interactionsCommands = withSubCommands('add', 'help', 'push', 'remove', 'update');
const javascriptCommands = withSubCommands('help');
const notificationsCommands = withSubCommands('add', 'configure', 'console', 'help', 'remove', 'status');
const predictionsCommands = withSubCommands('add', 'console', 'help', 'remove', 'update');

/**
 * Plugins shipped with the CLI, keyed by plugin name and plugin alias.
 * Plugin commands are the commands declared in each plugin's amplify-plugin.json.
 */
const pluginCommands: Readonly<Record<string, KnownCommand>> = {
  analytics: withSubCommands('add', 'console', 'help', 'push', 'remove', 'update'),
  android: withSubCommands('help'),
  api: withSubCommands(
    'add',
    'add-graphql-datasource',
    'console',
    'generate-schema',
    'gql-compile',
    'help',
    'import',
    'migrate',
    'override',
    'push',
    'rebuild',
    'remove',
    'update',
    'update-secrets',
  ),
  auth: withSubCommands('add', 'console', 'enable', 'help', 'import', 'override', 'push', 'remove', 'update'),
  aws: awsCloudFormationCommands,
  awscfn: awsCloudFormationCommands,
  awscloudformation: awsCloudFormationCommands,
  codegen: withSubCommands('add', 'codegen', 'configure', 'model-introspection', 'models', 'remove', 'statements', 'types'),
  custom: withSubCommands('add', 'build', 'help', 'remove', 'update'),
  flutter: withSubCommands('help'),
  function: withSubCommands('add', 'build', 'console', 'help', 'invoke', 'push', 'remove', 'update'),
  geo: withSubCommands('add', 'console', 'help', 'import', 'push', 'remove', 'update'),
  hosting: withSubCommands('add', 'configure', 'console', 'help', 'push', 'remove', 'serve'),
  interaction: interactionsCommands,
  interactions: interactionsCommands,
  ios: withSubCommands('help'),
  javascript: javascriptCommands,
  js: javascriptCommands,
  mock: withSubCommands('api', 'function', 'help', 'mock', 'storage'),
  notification: notificationsCommands,
  notifications: notificationsCommands,
  predictions: predictionsCommands,
  Predictions: predictionsCommands,
  root: awsCloudFormationCommands,
  storage: withSubCommands('add', 'console', 'help', 'import', 'override', 'push', 'remove', 'update'),
  'ui-builder': withSubCommands('cloneComponentsFromEnv', 'generateComponents', 'version'),
};

/**
 * Plugins, commands and subcommands shipped with the CLI.
 *
 * Usage data only records names that appear here.
 * Keep this in sync with the plugin manifests and command modules; known-commands.test.ts fails if they differ.
 */
export const knownCommands: KnownCommand = {
  subCommands: { [constants.CORE]: coreCommands, ...pluginCommands },
};

/**
 * Subcommands of the help command name the command that help is shown for,
 * for example `amplify env checkout --help` or `amplify api add --help`.
 */
const helpTopics: KnownCommand = {
  subCommands: { ...coreCommands.subCommands, ...pluginCommands },
};

const getSubCommand = (command: KnownCommand | undefined, name: string): KnownCommand | undefined =>
  // own-property check so that names such as 'constructor' or '__proto__' never match
  command?.subCommands && Object.prototype.hasOwnProperty.call(command.subCommands, name) ? command.subCommands[name] : undefined;

const matchKnownNames = (root: KnownCommand | undefined, names: readonly string[]): string[] => {
  const matched: string[] = [];
  let current = root;
  for (const name of names) {
    current = getSubCommand(current, name);
    matched.push(current ? name : unknownNamePlaceholder);
  }
  return matched;
};

/**
 * Returns the command input to record in usage data.
 *
 * Only known plugin, command and subcommand names are recorded, matched in that order.
 * Matching stops at the first name that is not known: that name and every name after it are recorded as a placeholder.
 */
export const getRecordedInput = (input: ICommandInput): CLIInput & { readonly plugin: string } => {
  // the CLI runs core commands when no plugin is specified
  const [plugin, command] = matchKnownNames(knownCommands, [input.plugin ?? constants.CORE, input.command]);
  const commandNode = getSubCommand(getSubCommand(knownCommands, plugin), command);
  return {
    argv: [],
    plugin,
    command,
    subCommands: input.subCommands && matchKnownNames(command === constants.HELP ? helpTopics : commandNode, input.subCommands),
  };
};
