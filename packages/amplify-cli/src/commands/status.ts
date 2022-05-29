import * as path from 'path';
import * as fs from 'fs-extra';
import { ViewResourceTableParams, CLIParams, $TSAny, $TSContext, pathManager, stateManager, ApiCategoryFacade } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

export const run = async (context: $TSContext) => {
  const cliParams: CLIParams = {
    cliCommand: context?.input?.command,
    cliSubcommands: context?.input?.subCommands,
    cliOptions: context?.input?.options,
  };

  const view = new ViewResourceTableParams(cliParams);
  if (context?.input?.subCommands?.includes('help')) {
    context.print.info(view.getStyledHelp());
  } else if (cliParams.cliOptions?.api && cliParams.cliOptions?.acm) {
    try {
      if (typeof cliParams.cliOptions?.acm !== 'string') {
        // In this case we have no model name passed in so error out
        printer.error('You must pass in a model name for the acm option.');
        return;
      }

      await showApiAuthAcm(context);
    } catch (err) {
      printer.error(err?.message);
    }
  } else {
    try {
      await context.amplify.showStatusTable(view);
      await context.amplify.showHelpfulProviderLinks(context);
      await showAmplifyConsoleHostingStatus(context);
    } catch (e) {
      view.logErrorException(e, context);
    }
  }
};

async function showAmplifyConsoleHostingStatus(context) {
  const pluginInfo = context.amplify.getCategoryPluginInfo(context, 'hosting', 'amplifyhosting');
  if (pluginInfo && pluginInfo.packageLocation) {
    const { status } = await import(pluginInfo.packageLocation);
    if (status) {
      await status(context);
    }
  }
}

async function showApiAuthAcm(context) {
  const providerPlugin = await import(context.amplify.getProviderPlugins(context)?.awscloudformation);
  const transformerVersion = await ApiCategoryFacade.getTransformerVersion(context);

  if (transformerVersion < 2) {
    printer.error('This command requires version two or greater of the GraphQL transformer.');
    return;
  }

  const apiNames = Object.entries(stateManager.getMeta()?.api || {})
    .filter(([_, apiResource]) => (apiResource as $TSAny).service === 'AppSync')
    .map(([name]) => name);

  if (apiNames.length === 0) {
    printer.info(
      'No GraphQL API configured in the project. Only GraphQL APIs can be migrated. To add a GraphQL API run `amplify add api`.',
    );
    return;
  }

  if (apiNames.length > 1) {
    // this condition should never hit as we only allow a single GraphQL API per project.
    printer.error(
      'You have multiple GraphQL APIs in the project. Only one GraphQL API is allowed per project. Run `amplify remove api` to remove an API.',
    );
    return;
  }

  // Do a full schema compilation to make sure we are not printing an ACM for an invalid schema
  try {
    await providerPlugin.compileSchema(context, {
      forceCompile: true,
    });
  } catch (error) {
    printer.warn('ACM generation requires a valid schema, the provided schema is invalid.');

    if (error.name) {
      printer.error(`${error.name}: ${error.message?.trim()}`);
    } else {
      printer.error(`An error has occured during schema compilation: ${error.message?.trim()}`);
    }

    return;
  }

  const apiName = apiNames[0];
  const apiResourceDir = path.join(pathManager.getBackendDirPath(), 'api', apiName);
  const schemaPath = path.join(apiResourceDir, 'schema.graphql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const cliOptions = context?.input?.options ?? {};
  const { showACM } = await import('../extensions/amplify-helpers/show-auth-acm');

  showACM(schema, cliOptions.acm);
}
