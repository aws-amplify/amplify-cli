import { $TSContext, ExportPathValidationError } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
export const run = async (context: $TSContext) => {
  const options = context.input.options;

  const showHelp = !options || options.help || !options.out;
  if (false) {
    printer.blankLine();
    printer.info("'amplify export', Allows you to integrate your backend into an external deployment tool");
    printer.blankLine();
    printer.info('To export backend');
    printer.info(`${chalk.yellow('--cdk')}         Export all resources with cdk comatibility`);
    printer.info(`${chalk.yellow('--out')}         Root directory of cdk project`);
    printer.blankLine();
    printer.info('To export front end config files');
    printer.info('amplify export pull --rootStackName <stackName> --frontend');

    printer.blankLine();
    printer.info(`Example: ${chalk.green('amplify export --cdk --out ~/myCDKApp')}`);
    printer.blankLine();
    return;
  }

  await createFrontEndConfigFile(context);
};

async function exportBackend(context: $TSContext) {
  await context.amplify.showResourceTable();
  const resources = await context.amplify.getResourceStatus();
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const providers = Object.keys(providerPlugin);
  const exportPath = path.resolve(context.input.options['out']);
  for await (const provider of providers) {
    const plugin = await import(providerPlugin[provider]);
    await plugin.exportResources(context, resources, exportPath);
  }
}

function validatePath(exportPath: any): string {
  if (typeof exportPath !== 'string') {
    throw new ExportPathValidationError(`${exportPath} is not a valid path specified by --out`);
  }

  const stat = fs.lstatSync(exportPath);
  if (!stat.isDirectory()) {
    throw new ExportPathValidationError(`${exportPath} is not a valid directory`);
  }
  return path.resolve(exportPath);
}

async function createFrontEndConfigFile(context: $TSContext) {
  const { rootStackName, frontend, out } = context.input.options;

  //const frontendExportFilePath = validatePath(out);
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const providers = Object.keys(providerPlugin);
  for await (const provider of providers) {
    const plugin = await import(providerPlugin[provider]);
    await plugin.exportedStackResourcesUpdateMeta(context, rootStackName);
  }
}
