import _ from 'lodash';
import { FunctionRuntime, FunctionDependency, LambdaLayer, ProjectLayer, ExternalLayer } from 'amplify-function-plugin-interface';
import { category } from '../../..';
import { ServiceName } from './constants';
import inquirer, { CheckboxQuestion, ListQuestion, InputQuestion } from 'inquirer';
import enquirer from 'enquirer';
import { LayerMetadataFactory } from './layerParams';

const layerSelectionPrompt = 'Provide existing layers or select layers in this project to access from this function (pick up to 5):';
export const provideExistingARNsPrompt = 'Provide existing Lambda layer ARNs';
const versionSelectionPrompt = (layerName: string) => `Select a version for ${layerName}:`;
const ARNEntryPrompt = (remainingLayers: number) => `Enter up to ${remainingLayers} existing Lambda layer ARNs (comma-separated):`;
const layerOrderPrompt = 'Modify the layer order (Layers with conflicting files will overwrite contents of layers earlier in the list):';
const layerARNRegex = /^arn:[a-zA-Z0-9-]+:lambda:[a-zA-Z0-9-]+:\d{12}:layer:[a-zA-Z0-9-_]+:\d+$/;

/**
 * Asks the customer to select from project layers and/or custom layer ARNs.
 *
 * Returns an array of LambdaLayer objects and a dependsOn array containing layers in the project
 * @param amplifyMeta current amplify meta (used to fetch layers currently in the project)
 * @param runtimeValue runtime value of the function being modified (used to filter layers by supported runtime)
 * @param previousSelections previous layers added to the function (used to populate default selections)
 */
export const askLayerSelection = async (
  layerMetadataFactory: LayerMetadataFactory,
  amplifyMeta,
  runtimeValue: string,
  previousSelections: LambdaLayer[] = [],
): Promise<{ lambdaLayers: LambdaLayer[]; dependsOn: FunctionDependency[]; askArnQuestion: boolean }> => {
  const lambdaLayers: LambdaLayer[] = [];
  const dependsOn: FunctionDependency[] = [];

  const functionMeta = _.get(amplifyMeta, [category]) || {};
  const layerOptions = _.keys(functionMeta)
    .filter(key => functionMeta[key].service === ServiceName.LambdaLayer)
    .filter(key => isRuntime(runtimeValue).inRuntimes(functionMeta[key].runtimes)); // filter by compatible runtimes

  if (layerOptions.length === 0) {
    return {
      lambdaLayers,
      dependsOn,
      askArnQuestion: true,
    };
  }
  const currentResourceNames = filterProjectLayers(previousSelections).map(sel => (sel as ProjectLayer).resourceName);
  const choices = layerOptions.map(op => ({ name: op, checked: currentResourceNames.includes(op) }));
  choices.unshift({ name: provideExistingARNsPrompt, checked: previousSelections.map(sel => sel.type).includes('ExternalLayer') });

  const layerSelectionQuestion: CheckboxQuestion = {
    type: 'checkbox',
    name: 'layerSelections',
    message: layerSelectionPrompt,
    choices: choices,
    validate: (input: string[]) => input.length <= 5 || 'Select at most 5 entries from the list',
  };
  let layerSelections = (await inquirer.prompt(layerSelectionQuestion)).layerSelections;
  const askArnQuestion = layerSelections.includes(provideExistingARNsPrompt);
  layerSelections = layerSelections.filter(selection => selection !== provideExistingARNsPrompt);

  for (let selection of layerSelections) {
    const currentSelectionDefaults = filterProjectLayers(previousSelections).find(sel => sel.resourceName === selection);
    const currentVersion = currentSelectionDefaults ? currentSelectionDefaults.version.toString() : undefined;
    const layerState = layerMetadataFactory(selection);
    await layerState.syncVersions(); // make sure we are reflecting the latest changes;
    const layerVersionPrompt: ListQuestion = {
      type: 'list',
      name: 'versionSelection',
      message: versionSelectionPrompt(selection),
      choices: layerState.listVersions().map(num => num.toString()),
      default: currentVersion,
      filter: numStr => parseInt(numStr, 10),
    };

    const versionSelection = (await inquirer.prompt(layerVersionPrompt)).versionSelection as number;
    lambdaLayers.push({
      type: 'ProjectLayer',
      resourceName: selection,
      version: versionSelection,
    });
    dependsOn.push({
      category,
      resourceName: selection,
      attributes: ['Arn'], // the layer doesn't actually depend on the ARN but there's some nasty EJS at the top of the function template that breaks without this, so here it is. Hurray for tight coupling!
    });
  }
  return {
    lambdaLayers,
    dependsOn,
    askArnQuestion,
  };
};

/**
 * Asks the customer to enter external layer ARNs
 * @param numLayersSelected The number of ARNs they can enter
 * @param previousSelections Array of previous layer selections (used to populate the default string)
 */
export const askCustomArnQuestion = async (numLayersSelected: number, previousSelections: LambdaLayer[] = []) => {
  const arnPrompt: InputQuestion = {
    type: 'input',
    name: 'arns',
    message: ARNEntryPrompt(5 - numLayersSelected),
    validate: lambdaLayerARNValidator,
    filter: stringSplitAndTrim,
    default:
      filterExternalLayers(previousSelections)
        .map(sel => sel.arn)
        .join(', ') || undefined,
  };
  return ((await inquirer.prompt(arnPrompt)).arns as string[]).map(arn => ({ type: 'ExternalLayer', arn } as LambdaLayer));
};

/**
 * Asks the customer to reorder the selected layers (if more than 1)
 * @param currentSelections Array of current selections the customer has made
 * @param previousSelections Array of previous selections, if any (used to reorder the current selections to their previous order)
 */
export const askLayerOrderQuestion = async (currentSelections: LambdaLayer[], previousSelections: LambdaLayer[] = []) => {
  if (currentSelections.length <= 1) {
    return currentSelections;
  }
  // order selections based on previous selection order, if applicable
  previousSelections.reverse().forEach(prevSel => {
    let idx = -1;
    switch (prevSel.type) {
      case 'ExternalLayer':
        idx = currentSelections.findIndex(currSel => currSel.type === 'ExternalLayer' && currSel.arn === prevSel.arn);
        break;
      default:
        idx = currentSelections.findIndex(currSel => currSel.type === 'ProjectLayer' && currSel.resourceName === prevSel.resourceName);
    }
    if (idx >= 0) {
      currentSelections.unshift(...currentSelections.splice(idx, 1)); // move element to beginning of list
    }
  });

  const sortPrompt = {
    type: 'sort',
    name: 'sortedNames',
    message: layerOrderPrompt,
    choices: currentSelections.map(ll => (ll.type === 'ExternalLayer' ? ll.arn : ll.resourceName)),
  };

  const sortedNames = (await enquirer.prompt<{ sortedNames: string[] }>(sortPrompt)).sortedNames;

  // sort the currentSelections based on the sortedNames
  const finalSelectionOrder: LambdaLayer[] = [];
  sortedNames.forEach(name =>
    finalSelectionOrder.push(currentSelections.find(sel => (sel.type === 'ExternalLayer' ? sel.arn === name : sel.resourceName === name))),
  );
  return finalSelectionOrder;
};

const isRuntime = (runtime: string) => ({
  inRuntimes: (runtimes: FunctionRuntime[]) => runtimes.map(runtime => runtime.value).includes(runtime),
});

const filterProjectLayers = (layers: LambdaLayer[]): ProjectLayer[] => {
  return layers.filter(layer => layer.type === 'ProjectLayer') as ProjectLayer[];
};

const filterExternalLayers = (layers: LambdaLayer[]): ExternalLayer[] => {
  return layers.filter(layer => layer.type === 'ExternalLayer') as ExternalLayer[];
};

const stringSplitAndTrim = (input: string): string[] => {
  return input
    .split(',')
    .map(str => str.trim())
    .filter(str => str); // filter out empty elements
};

// validates that each string in input is a valid lambda layer ARN
const lambdaLayerARNValidator = (input: string[]): true | string => {
  const invalidARNs = input.filter(arn => !arn.match(layerARNRegex));
  return invalidARNs.length === 0 ? true : `${invalidARNs.join(', ')} are not valid Lambda layer ARNs`;
};
