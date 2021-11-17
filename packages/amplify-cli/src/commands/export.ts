import {
  $TSContext,
  IAmplifyResource,
  stateManager,
  UnrecognizedFrontendError,
  validateExportDirectoryPath,
  PathConstants,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import chalk from 'chalk';
import { getResourceOutputs } from '../extensions/amplify-helpers/get-resource-outputs';
import Ora from 'ora';
import { getResources } from './build';
import * as _ from 'lodash';

export const run = async (context: $TSContext) => {
  const subCommands = context.input.subCommands;
  const showHelp = getSafeInputOptionsFlag(context, 'help') || false;
  const isPull = !!(subCommands && subCommands.includes('pull'));
  const frontend = getSafeInputOptionsFlag(context, 'frontend');
  const rootStackName = getSafeInputOptionsFlag(context, 'rootStackName');
  const showPullHelp = (showHelp || !frontend || !rootStackName) && isPull;

  if (showHelp && !showPullHelp) {
    printer.blankLine();
    printer.info("'amplify export', exports your Amplify backend into CDK app");
    printer.blankLine();
    printer.info(`${chalk.yellow('--cdk')}         Exports all Amplify-generated resources as CDK`);
    printer.info(`${chalk.yellow('--out')}         Folder to export stack to`);
    printer.blankLine();
    printer.info(`Example: ${chalk.green('amplify export --cdk --out ~/myCDKApp')}`);
    printer.blankLine();
    printer.info("'amplify export pull' To export front-end config files'");
    printer.info("'amplify export pull --help'  to learn");
    printer.blankLine();
    return;
  }

  if (showPullHelp) {
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontends = Object.keys(frontendPlugins);
    printer.blankLine();
    printer.info("'amplify export pull', Allows you to genreate frontend config files at a desired location");
    printer.blankLine();
    printer.info(`${chalk.yellow('--rooStackName')}         Amplify CLI deployed Root Stack name`);
    printer.info(`${chalk.yellow('--frontend')}             Front end type ex: ${frontends.join(', ')}`);
    printer.info(`${chalk.yellow('--out')}                  Directory to write the front-end config files`);
    printer.blankLine();
    printer.info(
      `Example: ${chalk.green(
        'amplify export pull --rootStackName amplify-myapp-stack-123 --out ~/myCDKApp/src/config/ --frontend javascript',
      )}`,
    );
    printer.blankLine();
    printer.blankLine();
    return;
  }
  const exportPath = _.get(context, ['input', 'options', 'out']);
  if (isPull) {
    await createFrontEndConfigFile(context, exportPath);
  } else {
    await exportBackend(context, exportPath);
  }
};

async function exportBackend(context: $TSContext, exportPath: string) {
  await buildAllResources(context);
  const resources = await context.amplify.getResourceStatus();
  await context.amplify.showResourceTable();
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const providers = Object.keys(providerPlugin);
  for await (const provider of providers) {
    const plugin = await import(providerPlugin[provider]);
    await plugin.exportResources(context, resources, exportPath);
  }
}

async function buildAllResources(context: $TSContext) {
  const resourcesToBuild: IAmplifyResource[] = await getResources(context);
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', { resourcesToBuild, forceCompile: true });
}

async function createFrontEndConfigFile(context: $TSContext, exportPath: string) {
  const { rootStackName, frontend } = context.input.options;

  const frontendSet = new Set(Object.keys(context.amplify.getFrontendPlugins(context)));
  if (!frontendSet.has(frontend)) {
    throw new UnrecognizedFrontendError(`${frontend} is not a supported Amplify frontend`);
  }
  const spinner = Ora(`Extracting outputs from ${rootStackName}`);

  spinner.start();
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const providers = Object.keys(providerPlugin);
  try {
    for await (const provider of providers) {
      const plugin = await import(providerPlugin[provider]);
      await plugin.exportedStackResourcesUpdateMeta(context, rootStackName);
    }
    spinner.text = `Generating files at ${exportPath}`;
    const meta = stateManager.getMeta();
    const cloudMeta = stateManager.getCurrentMeta();
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule = require(frontendPlugins[frontend]);
    const validatedExportPath = validateExportDirectoryPath(exportPath, PathConstants.DefaultFrontEndExportFolder);
    await frontendHandlerModule.createFrontendConfigsAtPath(
      context,
      getResourceOutputs(meta),
      getResourceOutputs(cloudMeta),
      validatedExportPath,
    );
    spinner.succeed('Successfully generated frontend config files');
  } catch (ex: any) {
    spinner.fail('Failed to generate frontend config files ' + ex.message);
    throw ex;
  } finally {
    spinner.stop();
  }
}

const getSafeInputOptionsFlag = (context: $TSContext, flag: string) => _.get(context, ['input', 'options', flag]);
