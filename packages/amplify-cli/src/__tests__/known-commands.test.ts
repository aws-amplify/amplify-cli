import * as fs from 'fs';
import * as path from 'path';
import { commandsInfo } from '@aws-amplify/amplify-cli-core';
import { knownCommands } from '../domain/amplify-usageData/known-commands';

type PluginManifest = {
  name: string;
  aliases?: string[];
  commands?: string[];
};

const cliPackageRoot = path.join(__dirname, '..', '..');
const commandsDirectory = path.join(__dirname, '..', 'commands');

const readJson = <T>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, 'utf8'));

/**
 * Reads the plugin manifests of the CLI and of every dependency that ships one, keeping plugins that have commands.
 */
const readFirstPartyManifests = (): PluginManifest[] => {
  const { dependencies } = readJson<{ dependencies: Record<string, string> }>(path.join(cliPackageRoot, 'package.json'));
  const packageRoots = [
    cliPackageRoot,
    ...Object.keys(dependencies).map((name) => path.dirname(require.resolve(`${name}/package.json`, { paths: [cliPackageRoot] }))),
  ];
  return packageRoots
    .map((packageRoot) => path.join(packageRoot, 'amplify-plugin.json'))
    .filter((manifestPath) => fs.existsSync(manifestPath))
    .map((manifestPath) => readJson<PluginManifest>(manifestPath))
    .filter((manifest) => (manifest.commands ?? []).length > 0);
};

const knownNames = (...names: string[]): string[] => {
  const command = names.reduce((current, name) => current.subCommands?.[name] ?? {}, knownCommands);
  return Object.keys(command.subCommands ?? {}).sort();
};

const commandModuleNames = (directory: string): string[] =>
  fs
    .readdirSync(path.join(commandsDirectory, directory))
    .filter((fileName) => fileName.endsWith('.ts'))
    .map((fileName) => path.basename(fileName, '.ts'));

describe('known commands', () => {
  it('include every plugin name and alias of the plugins shipped with the CLI', () => {
    const manifests = readFirstPartyManifests();
    const pluginNames = manifests.flatMap((manifest) => [manifest.name, ...(manifest.aliases ?? [])]);
    expect(knownNames()).toEqual([...new Set(pluginNames)].sort());
  });

  it('include exactly the commands declared by each plugin shipped with the CLI', () => {
    const manifests = readFirstPartyManifests();
    manifests.forEach((manifest) => {
      const declaredCommands = manifests.filter(({ name }) => name === manifest.name).flatMap(({ commands }) => commands ?? []);
      [manifest.name, ...(manifest.aliases ?? [])].forEach((pluginName) => {
        expect({ pluginName, commands: knownNames(pluginName) }).toEqual({ pluginName, commands: [...new Set(declaredCommands)].sort() });
      });
    });
  });

  it('include the env subcommand modules', () => {
    expect(knownNames('core', 'env')).toEqual([...commandModuleNames('env'), 'help', 'ls'].sort());
  });

  it('include the plugin subcommand modules', () => {
    expect(knownNames('core', 'plugin')).toEqual([...commandModuleNames('plugin'), 'init'].sort());
  });

  it('include the gen2-migration subcommand modules', () => {
    expect(knownNames('core', 'gen2-migration')).toEqual(commandModuleNames('gen2-migration').sort());
  });

  it('include the status subcommands used for help', () => {
    const statusHelpSubCommands = commandsInfo
      .filter(({ command }) => command === 'status')
      .flatMap(({ subCommands }) => subCommands.map(({ subCommand }) => subCommand));
    expect(knownNames('core', 'status')).toEqual([...statusHelpSubCommands, 'help', 'verbose'].sort());
  });

  it('do not use the same name for a core command and a plugin', () => {
    const coreCommandNames = knownNames('core');
    expect(knownNames().filter((pluginName) => coreCommandNames.includes(pluginName))).toEqual([]);
  });
});
