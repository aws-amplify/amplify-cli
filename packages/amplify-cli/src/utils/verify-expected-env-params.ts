import { $TSContext, IAmplifyResource } from 'amplify-cli-core';
import { ensureEnvParamManager, IEnvironmentParameterManager } from '@aws-amplify/amplify-environment-parameters';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { getResources } from '../commands/build';

export const verifyExpectedEnvParams = async (context: $TSContext, category?: string, resourceName?: string) => {
  const envParamManager = (await ensureEnvParamManager()).instance;
  const resourcesToBuild: IAmplifyResource[] = await getResources(context);

  const parametersToCheck = resourcesToBuild.filter(({ category: c, resourceName: r }) => {
    // Filter based on optional parameters
    if ((category && c !== category) || (resourceName && r !== resourceName)) {
      return false;
    }
    return true;
  });

  if (context?.exeInfo?.inputParams?.yes || context?.exeInfo?.inputParams?.headless) {
    await envParamManager.verifyExpectedEnvParameters(parametersToCheck);
  } else {
    const missingParameters = await envParamManager.getMissingParameters(parametersToCheck);
    if (missingParameters.length > 0) {
      for (const { categoryName, resourceName, parameterName } of missingParameters) {
        await promptMissingParameter(categoryName, resourceName, parameterName, envParamManager);
      }
      await envParamManager.save(); // Values must be in TPI for CFN deployment to work
    }
  }
};

const promptMissingParameter = async (
  categoryName: string,
  resourceName: string,
  parameterName: string,
  envParamManager: IEnvironmentParameterManager,
): Promise<void> => {
  printer.warn(`Could not find value for parameter ${parameterName}`);
  const value = await prompter.input(`Enter a value for ${parameterName} for the ${categoryName} resource: ${resourceName}`);
  const resourceParamManager = envParamManager.getResourceParamManager(categoryName, resourceName);
  resourceParamManager.setParam(parameterName, value);
};
