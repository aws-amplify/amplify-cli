import * as path from 'path';
import _ from 'lodash';
import semver from 'semver';
import { $TSContext, JSONUtilities, stateManager } from 'amplify-cli-core';
import * as CloudFormation from 'aws-sdk/clients/cloudformation';

const packageJsonFileName = 'package.json';
const disableVersionGatingEnvVarName = 'AMPLIFY_CLI_DISABLE_VERSION_CHECK';

// Allowed Commands: 'configure', 'console', 'env list', 'help', 'init', 'logout', 'version', 'status', 'pull'

// Type used internally for object matching
type CommandMatch = {
  plugins: string[];
  command: string;
};

type Command = {
  plugin?: string;
  command: string;
};

type VersionGatingMetadata = {
  DeployedByCLIVersion?: string;
  MinimumCompatibleCLIVersion?: string;
};

export const versionGatingBlockedCommands: CommandMatch[] = [
  {
    plugins: ['*'],
    command: 'add',
  },
  {
    plugins: ['*'],
    command: 'update',
  },
  {
    plugins: ['*'],
    command: 'remove',
  },
  {
    plugins: ['*'],
    command: 'push',
  },
  {
    plugins: ['*'],
    command: 'publish',
  },
  {
    plugins: ['api'],
    command: 'gql-compile',
  },
];

export const readCLIPackageJson = <T>(): T => {
  const packageJsonPath = path.join(__dirname, '..', '..', packageJsonFileName);

  const packageJsonContent = JSONUtilities.readJson<T>(packageJsonPath);

  return packageJsonContent! as T;
};

export const getCurrentCLIVersion = (): string => {
  const { version } = readCLIPackageJson<{ version: string }>();

  // This data always exists in package.json
  return version;
};

export const getMinimumCompatibleCLIVersion = (): string => {
  const { 'amplify-cli': amplifyCLI } = readCLIPackageJson<{ 'amplify-cli': { configuration: { minimumCompatibleCLIVersion: string } } }>();

  // This data always exists in package.json
  return amplifyCLI.configuration.minimumCompatibleCLIVersion;
};

/*

Summary for the version gating logic:

Inputs:
- M: Metadata in root stack
- CV: Currently running CLI verison
- CMin: Minimum version value defined in currently running CLI's package.json
- DV: Version of the CLI the root stack was deployed with last time
- DMin: Minimum required CLI version for deployment

Checks:
- M == null or no version info present => pass (Current CLI is newer always)
- CV >= DMin => pass (CV >= CMin always so no need to check)
- In all other cases => fail (for example: DMin > CV)

Notes:
- DV: It is possible that this information will change from 5.1.0 to 5.0.2 and 5.1.3 with pushes as long as DMin is 5.0.0.
- DV: is not used for any checks, just persisted for diagnostic purposes.

Cases we cannot handle:
- If a CLI version is used which does not have version gating, will always can run against a newer stack, which will nuke out
  the metadata we added.

*/

export const isMinimumVersionSatisfied = async (context: $TSContext): Promise<boolean> => {
  // Check if version gating is disabled via the environment variable
  if (!!process.env[disableVersionGatingEnvVarName]) {
    return true;
  }

  const currentCommand: Command = {
    plugin: context.input.plugin,
    command: context.input.command,
  };

  const isBlockedCommand = isCommandInMatches(currentCommand, versionGatingBlockedCommands);

  if (isBlockedCommand === false) {
    return true;
  }

  // At this point the command is blocking so version check must be performed against current CLI version
  // and the minimum CLI version vs. the deployed version from the root stack metadata (if any)

  const meta = stateManager.getMeta(undefined, {
    throwIfNotExist: false,
  });

  const rootStackName = _.get(meta, ['providers', 'awscloudformation', 'StackName']);

  if (rootStackName === undefined) {
    // No meta or root stack name is not present, which means that version gating cannot be enforced on an uninitialized project
    // so assume version check passed as the rest of the CLI will validate the command in question for execution.
    return true;
  }

  const cloudFormation: { cfn: CloudFormation } = await context.amplify.invokePluginMethod(
    context,
    'awscloudformation',
    undefined,
    'getCloudFormationSdk',
    [context],
  );

  const cfnClient: CloudFormation = cloudFormation.cfn as CloudFormation;

  const templateSummary = await cfnClient
    .getTemplateSummary({
      StackName: rootStackName,
    })
    .promise();

  const metadataValue = _.get(templateSummary, ['Metadata']) || '{}';
  const metadata = JSONUtilities.parse(metadataValue);
  const versionGatingMetadata: VersionGatingMetadata = _.get(metadata, ['AmplifyCLI']);

  // If no metadata or version info in metadata was found in the root stack template, then
  // assume version check passed as current CLI is newer than the stack was deployed with.
  if (
    versionGatingMetadata === undefined ||
    versionGatingMetadata.MinimumCompatibleCLIVersion === undefined ||
    versionGatingMetadata.DeployedByCLIVersion === undefined
  ) {
    return true;
  }

  // These are always valid version numbers as CLI creating them.
  const stackMinimumCompatibleCLIVersion = semver.coerce(versionGatingMetadata.MinimumCompatibleCLIVersion)!;

  // Pick the greater minimum version
  const minimumCompatibleCLIVersion = semver.gt(stackMinimumCompatibleCLIVersion, context.versionInfo.minimumCompatibleCLIVersion)
    ? stackMinimumCompatibleCLIVersion
    : semver.coerce(context.versionInfo.minimumCompatibleCLIVersion)!;

  // If current version is greater than
  if (semver.gte(context.versionInfo.currentCLIVersion, minimumCompatibleCLIVersion)) {
    return true;
  }

  const deployedCLIVersion = semver.coerce(versionGatingMetadata.DeployedByCLIVersion)!;

  context.print.warning(
    `This project was previously deployed with Amplify CLI version ${deployedCLIVersion}. The currently running Amplify CLI version is ${context.versionInfo.currentCLIVersion}.`,
  );

  context.print.info('');
  context.print.info(`Some features in this project require Amplify CLI version >=${minimumCompatibleCLIVersion} to function correctly.`);
  context.print.info('Upgrade to the latest version of Amplify CLI, run: "amplify upgrade" or "npm install -g @aws-amplify/cli"');

  return false;
};

export const isCommandInMatches = (command: Command, commandsToMatch: CommandMatch[]): boolean => {
  for (const commandToMatch of commandsToMatch) {
    if (
      ((commandToMatch.plugins.length === 1 && commandToMatch.plugins[0] === '*') || _.includes(commandToMatch.plugins, command.plugin)) &&
      commandToMatch.command === command.command
    ) {
      return true;
    }
  }

  return false;
};
