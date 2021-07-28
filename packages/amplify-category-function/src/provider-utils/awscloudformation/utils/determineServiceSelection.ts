import { ServiceName } from './constants';
import { categoryName } from '../../../constants';
import { supportedServices } from '../../supported-services';

export const determineServiceSelection = async (context, chooseServiceMessage) => {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaLayerExists = allResources.filter(resource => resource.service === ServiceName.LambdaLayer).length > 0;
  const lambdaFunctionExists =
    allResources.filter(resource => resource.service === ServiceName.LambdaFunction && resource.mobileHubMigrated !== true).length > 0;

  if ((!lambdaFunctionExists && !lambdaLayerExists) || (lambdaFunctionExists && !lambdaLayerExists)) {
    return {
      service: ServiceName.LambdaFunction,
    };
  }

  if (!lambdaFunctionExists && lambdaLayerExists) {
    return {
      service: ServiceName.LambdaLayer,
    };
  }

  return await context.amplify.serviceSelectionPrompt(context, categoryName, supportedServices, chooseServiceMessage);
};
