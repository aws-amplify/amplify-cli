import { $TSContext, stateManager } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { updateCloudFormationWalkthrough } from '../../walkthroughs/cloudformation-walkthrough';
const categoryName = 'custom';
const cfnServiceName = 'customCloudformation';

module.exports = {
  name: 'update',
  run: async (context: $TSContext) => {
    printer.warn(
      'Only raw CloudFormation tempaltes can be updated with this flow. For updating custom CDK rsources, update the CDK code in the resource folder directly.',
    );

    const amplifyMeta = stateManager.getMeta();
    const customResources = categoryName in amplifyMeta ? Object.keys(amplifyMeta[categoryName]) : [];
    const customCFNResources = customResources.filter(name => amplifyMeta[categoryName][name].service === cfnServiceName);

    if (customCFNResources.length > 0) {
      const resourceName = await prompter.pick('Specify the resource that you would want to update', customCFNResources);
      await updateCloudFormationWalkthrough(context, resourceName);
    } else {
      printer.error('No custom CloudFormation resources found.');
    }
  },
};
