import { $TSContext, ExportPathValidationError } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as chalk from 'chalk';
import * as fs from 'fs-extra';
import * as path from 'path';
export const run = async (context: $TSContext) => {
  const options = context.input.options;

  const showHelp = !options || options.help || !options.out;
  if (showHelp) {
    printer.blankLine();
    printer.info("'amplify export', Allows you to integrate your backend into an external deployment tool");
    printer.blankLine();
    printer.info(`${chalk.yellow('--cdk')}         Export all resources with cdk comatibility`);
    printer.info(`${chalk.yellow('--out')}         Root directory of cdk project`);
    printer.blankLine();
    printer.info(`Example: ${chalk.green('amplify export --cdk --out ~/myCDKApp')}`);
    printer.blankLine();
    return;
  }

  await context.amplify.showResourceTable();
  const resources = await context.amplify.getResourceStatus();
  const providerPlugin = context.amplify.getProviderPlugins(context);
  const providers = Object.keys(providerPlugin);
  const exportPath = path.resolve(context.input.options['out']);
  for await (const provider of providers) {
    const plugin = await import(providerPlugin[provider]);
    await plugin.exportResources(context, resources, exportPath);
  }
};
