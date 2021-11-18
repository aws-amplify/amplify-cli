import {
  $TSContext,
  AmplifyCategories,
  AmplifySupportedService,
  generateOverrideSkeleton,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as path from 'path';
import { checkAppsyncApiResourceMigration } from '../../provider-utils/awscloudformation/utils/check-appsync-api-migration';

export const name = 'override';

export const run = async (context: $TSContext) => {
  const amplifyMeta = stateManager.getMeta();
  const apiResources: string[] = [];

  if (amplifyMeta[AmplifyCategories.API]) {
    Object.keys(amplifyMeta[AmplifyCategories.API]).forEach(resourceName => {
      apiResources.push(resourceName);
    });
  }

  if (apiResources.length === 0) {
    const errMessage = 'No resources to override. You need to add a resource.';
    printer.error(errMessage);
    return;
  }

  let selectedResourceName: string = apiResources[0];

  if (apiResources.length > 1) {
    selectedResourceName = await prompter.pick('Which resource would you like to add overrides for?', apiResources);
  }

  const { service }: { service: string } = amplifyMeta[AmplifyCategories.API][selectedResourceName];
  const destPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.API, selectedResourceName);

  const srcPath = path.join(
    __dirname,
    '..',
    '..',
    '..',
    'resources',
    'awscloudformation',
    'overrides-resource',
    service === AmplifySupportedService.APIGW ? 'APIGW' : service, // avoid space in filename
  );

  // Make sure to migrate first
  if (service === AmplifySupportedService.APPSYNC) {
    /**
     * Below steps checks for TransformerV1 app and updates the FF { useexperimentalpipelinedtransformer , transformerversion}
     */
    const transformerVersion = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getTransformerVersion', [
      context,
    ]);
    if (transformerVersion === 2 && (await checkAppsyncApiResourceMigration(context, selectedResourceName, false))) {
      await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'compileSchema', [context, { forceCompile: true }]);
      await generateOverrideSkeleton(context, srcPath, destPath);
    } else {
      printer.warn(`The GraphQL API is using transformer version 1. Run 'amplify migrate api' to upgrade to transformer version 2.`);
    }
  }
};
