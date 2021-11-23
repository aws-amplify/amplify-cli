import { $TSContext } from "../index";

import { FeatureFlags } from '../feature-flags';
import { stateManager, pathManager } from '../state-manager'

export function getTransformerVersion(context: $TSContext): number {
  migrateToTransformerVersionFeatureFlag(context);

  const transformerVersion = FeatureFlags.getNumber('graphQLTransformer.transformerVersion');
  if (transformerVersion !== 1 && transformerVersion !== 2) {
    throw new Error(`Invalid value specified for transformerVersion: '${transformerVersion}'`);
  }

  return transformerVersion;
}

async function migrateToTransformerVersionFeatureFlag(context: $TSContext) {
  const projectPath = pathManager.findProjectRoot() ?? process.cwd();

  let config = stateManager.getCLIJSON(projectPath, undefined, {
    throwIfNotExist: false,
    preserveComments: true,
  });

  const useExperimentalPipelineTransformer = FeatureFlags.getBoolean('graphQLTransformer.useExperimentalPipelinedTransformer');
  const transformerVersion = FeatureFlags.getNumber('graphQLTransformer.transformerVersion');

  if (useExperimentalPipelineTransformer && transformerVersion === 1) {
    config.features.graphqltransformer.transformerversion = 2;
    stateManager.setCLIJSON(projectPath, config);
    await FeatureFlags.reloadValues();

    context.print.warning(
      `\nThe project is configured with 'transformerVersion': ${transformerVersion}, but 'useExperimentalPipelinedTransformer': ${useExperimentalPipelineTransformer}. Setting the 'transformerVersion': ${config.features.graphqltransformer.transformerversion}. 'useExperimentalPipelinedTransformer' is deprecated.`,
    );
  }
}
