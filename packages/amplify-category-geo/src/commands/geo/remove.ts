import { chooseServiceMessageRemove } from '../../provider-utils/awscloudformation/utils/constants';
import { category } from '../../constants';
import { supportedServices } from '../../provider-utils/supportedServices';
import { removeWalkthrough } from '../../provider-utils/awscloudformation/service-walkthroughs/removeWalkthrough';

const subcommand = 'remove';

module.exports = {
  name: subcommand,
  run: async (context: any) => {
    const { amplify } = context;
    const servicesMetadata = supportedServices;

    const selectedService = await amplify.serviceSelectionPrompt(
        context, 
        category, 
        servicesMetadata, 
        chooseServiceMessageRemove
    );
    
    const resourceToRemove = await removeWalkthrough(context, selectedService.service);

    return amplify
      .removeResource(context, category, resourceToRemove)
      .catch(err => {
        if (err.stack) {
          context.print.info(err.stack);
          context.print.error('An error occurred when removing the geo resource');
        }

        context.usageData.emitError(err);
        process.exitCode = 1;
    });
  }
};
