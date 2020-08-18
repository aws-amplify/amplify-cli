import { FeatureFlags, JSONUtilities } from 'amplify-cli-core';
import { FunctionParameters, FunctionRuntime, LambdaLayer, FunctionDependency } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import { askLayerSelection, askCustomArnQuestion, askLayerOrderQuestion } from '../utils/addLayerToFunctionUtils';
import { getLayerMetadataFactory } from '../utils/layerParams';
import { loadProjectLayers } from '../utils/loadProjectLayers';

const confirmationPrompt = 'Do you want to configure Lambda layers for this function?';

/**
 * Performs the walkthrough to add layers to a function
 * @param context Amplify platform context
 * @param runtime Runtime of the function that is being modified
 * @param previousSelections Array of layers already added to this function (if any)
 */
export const addLayersToFunctionWalkthrough = async (
  context,
  runtime: Pick<FunctionRuntime, 'value'>,
  previousSelections: LambdaLayer[] = [],
  featureFlags = FeatureFlags,
): Promise<Required<Pick<FunctionParameters, 'lambdaLayers' | 'dependsOn'>>> => {
  let lambdaLayers: LambdaLayer[] = [];
  let dependsOn: FunctionDependency[] = [];

  // ask initial confirmation
  if (!(await context.amplify.confirmPrompt(confirmationPrompt, false))) {
    return { lambdaLayers: previousSelections, dependsOn };
  }

  let askArnQuestion: boolean;
  if (featureFlags.getBoolean('lambdaLayers.multiEnv')) {
    const projectLayers = await loadProjectLayers(context);

    ({ lambdaLayers, dependsOn, askArnQuestion } = await askLayerSelection(
      getLayerMetadataFactory(context),
      projectLayers,
      runtime.value,
      previousSelections,
    ));
  } else {
    ({ lambdaLayers, dependsOn, askArnQuestion } = await askLayerSelection(
      getLayerMetadataFactory(context),
      context.amplify.getProjectMeta(),
      runtime.value,
      previousSelections,
    ));
  }

  if (askArnQuestion) {
    lambdaLayers = lambdaLayers.concat(await askCustomArnQuestion(lambdaLayers.length, previousSelections));
  }

  if (lambdaLayers.length === 0) {
    context.print.info('No Lambda layers were selected');
    if (previousSelections.length > 0) {
      const plural = previousSelections.length > 1 ? 's' : '';
      const removeMessage = `Removing ${previousSelections.length} previously added Lambda layer${plural} from Lambda function`;
      context.print.info(removeMessage);
    }
  }

  lambdaLayers = await askLayerOrderQuestion(lambdaLayers, previousSelections);

  return { lambdaLayers, dependsOn };
};
