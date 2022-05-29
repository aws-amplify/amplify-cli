import { $TSContext, $TSObject, AmplifyCategories, AmplifySupportedService } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as path from 'path';

const subcommand = 'add';
const category = AmplifyCategories.API;

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const servicesMetadata = (await import(path.join('..', '..', 'provider-utils', 'supported-services'))).supportedServices;
  return context.amplify
    .serviceSelectionPrompt(context, category, servicesMetadata)
    .then(async result => {
      const options = {
        service: result.service,
        providerPlugin: result.providerName,
      };
      const providerController = await import(path.join('..', '..', 'provider-utils', result.providerName, 'index'));
      if (!providerController) {
        printer.error('Provider not configured for this category');
        return;
      }

      if ((await shouldUpdateExistingRestApi(context, result.service)) === true) {
        return providerController.updateResource(context, category, result.service, { allowContainers: false });
      }

      return providerController.addResource(context, result.service, options);
    })
    .then((resourceName: string) => {
      printer.success(`Successfully added resource ${resourceName} locally`);
      printer.blankLine();
      printer.success('Some next steps:');
      printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
      printer.info(
        '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
      );
      printer.blankLine();
    })
    .catch(async err => {
      printer.error('There was an error adding the API resource');
      throw err;
    });
};

async function shouldUpdateExistingRestApi(context: $TSContext, selectedService: string): Promise<boolean> {
  if (selectedService !== AmplifySupportedService.APIGW) {
    return false;
  }

  const { allResources } = await context.amplify.getResourceStatus();
  const hasRestApis = allResources.some(
    (resource: $TSObject) => resource.service === AmplifySupportedService.APIGW && resource.mobileHubMigrated !== true,
  );

  if (!hasRestApis) {
    return false;
  }

  return prompter.confirmContinue('Would you like to add a new path to an existing REST API:');
}
