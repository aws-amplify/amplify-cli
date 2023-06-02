import {
  $TSContext,
  IAmplifyResource,
  stateManager,
  UnrecognizedFrontendError,
  validateExportDirectoryPath,
  PathConstants,
} from '@aws-amplify/amplify-cli-core';
import { getResourceOutputs } from '../extensions/amplify-helpers/get-resource-outputs';
import Ora from 'ora';
import { getChangedResources } from './build';
import * as _ from 'lodash';

export const run = async (context: $TSContext) => {
  const subCommands = context.input.subCommands;
  const isPull = !!(subCommands && subCommands.includes('pull'));
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
  const resourcesToBuild: IAmplifyResource[] = await getChangedResources(context);
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', { resourcesToBuild, forceCompile: true });
}

async function createFrontEndConfigFile(context: $TSContext, exportPath: string) {
  const { rootStackName, frontend } = context.input.options ?? {};

  const frontendSet = new Set(Object.keys(context.amplify.getFrontendPlugins(context)));
  if (!frontend || (frontend && !frontendSet.has(frontend))) {
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
    const frontendHandlerModule = await import(frontendPlugins[frontend]);
    const validatedExportPath = validateExportDirectoryPath(exportPath, PathConstants.DefaultFrontEndExportFolder);
    await frontendHandlerModule.createFrontendConfigsAtPath(
      context,
      getResourceOutputs(meta),
      getResourceOutputs(cloudMeta),
      validatedExportPath,
    );
    spinner.succeed('Successfully generated frontend config files');
  } catch (ex) {
    spinner.fail('Failed to generate frontend config files ' + ex.message);
    throw ex;
  } finally {
    spinner.stop();
  }
}
